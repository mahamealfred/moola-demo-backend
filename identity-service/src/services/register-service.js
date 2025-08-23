import axios from "axios";
import xml2js from 'xml2js';
import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

export const clientRegistrationService = async (req, res, email, password, username, firstName, lastName, identity, phoneNumber) => {
  let data = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mem="http://members.webservices.cyclos.strohalm.nl/">\r\n   <soapenv:Header/>\r\n   <soapenv:Body>\r\n      <mem:registerMember>\r\n         <!--Optional:-->\r\n         <params>\r\n            <groupId>25</groupId>\r\n            <username>${username}</username>\r\n            <name>${firstName + " " + lastName}</name>\r\n            <email>${email}</email>\r\n            <loginPassword>${password}</loginPassword>\r\n            <fields>\r\n               <internalName>Phone_User_ID</internalName>\r\n               <fieldId>8</fieldId>\r\n               <displayName>Phone/User ID</displayName>\r\n               <value>${phoneNumber}</value>\r\n               <!--Optional:-->\r\n               <internalName>national_id</internalName>\r\n               <fieldId>3</fieldId>\r\n               <displayName>National_Id</displayName>\r\n               <value>${identity}</value>\r\n            </fields>\r\n         </params>\r\n      </mem:registerMember>\r\n   </soapenv:Body>\r\n</soapenv:Envelope>`;

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: process.env.CYCLOS_URL+'/services/members',
    headers: {
      'Content-Type': 'application/xml'
    },
    data: data
  };
  try {
    const response = await axios.request(config);
    logger.warn("Successfully registered");
    return res.status(200).json({
      success: true,
      message: "Your account has been created successfully. We're excited to have you with us.",
    });
  } catch (error) {
    // console.log("Error from SOAP:", error.response?.data);
    const parser = new xml2js.Parser({
      explicitArray: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });

    try {
      const result = await parser.parseStringPromise(error.response?.data || '');
      const fault = result.Envelope?.Body?.Fault;
      const faultString = fault?.faultstring;

      logger.error("Error while saving in Cyclos:");
      return res.status(400).json({
        success: false,
        message: faultString || "An error occurred",
      });
    } catch (parseError) {
      logger.error("Failed to parse SOAP error response:", parseError);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing the SOAP response",
      });
    }
  }
};

export const agentRegistrationService = async (
  req,
  res,
  email,
  password,
  username,
  firstName,
  lastName,
  phoneNumber,
  area,
  district,
  sector,
  cell,
  agentCategory
) => {
  let data = `
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mem="http://members.webservices.cyclos.strohalm.nl/">
    <soapenv:Header/>
    <soapenv:Body>
      <mem:registerMember>
        <params>
          <groupId>5</groupId>
          <username>${username}</username>
          <name>${firstName} ${lastName}</name>
          <email>${email}</email>
          <loginPassword>${password}</loginPassword>

          <fields>
            <internalName>Phone_User_ID</internalName>
            <fieldId>8</fieldId>
            <displayName>Phone/User ID</displayName>
            <value>${phoneNumber}</value>
          </fields>

          <fields>
            <internalName>area</internalName>
            <fieldId>6</fieldId>
            <displayName>Province</displayName>
            <value>${area}</value>
          </fields>

          <fields>
            <internalName>district</internalName>
            <fieldId>15</fieldId>
            <displayName>District</displayName>
            <value>${district}</value>
          </fields>

          <fields>
            <internalName>sector</internalName>
            <fieldId>16</fieldId>
            <displayName>Sector</displayName>
            <value>${sector}</value>
          </fields>

          <fields>
            <internalName>Cell</internalName>
            <fieldId>161</fieldId>
            <displayName>Cell</displayName>
            <value>${cell}</value>
          </fields>

          <fields>
            <internalName>user_level</internalName>
            <fieldId>42</fieldId>
            <displayName>User Level</displayName>
            <value>agent</value>
          </fields>

          <fields>
            <internalName>agent_category</internalName>
            <fieldId>43</fieldId>
            <displayName>Agent Category</displayName>
            <value>${agentCategory}</value>
          </fields>
        </params>
      </mem:registerMember>
    </soapenv:Body>
  </soapenv:Envelope>`;

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: process.env.CYCLOS_URL+'/services/members',
    headers: {
      'Content-Type': 'application/xml'
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    logger.warn("Successfully registered");
    return res.status(200).json({
      success: true,
      message: "Your account has been created successfully. We're excited to have you with us.",
    });
  } catch (error) {
    const parser = new xml2js.Parser({
      explicitArray: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });

    try {
      const result = await parser.parseStringPromise(error.response?.data || '');
      const fault = result.Envelope?.Body?.Fault;
      const faultString = fault?.faultstring;

      logger.error("Error while saving in Cyclos:");
      return res.status(400).json({
        success: false,
        message: faultString || "An error occurred",
      });
    } catch (parseError) {
      logger.error("Failed to parse SOAP error response:", parseError);
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing the SOAP response",
      });
    }
  }
};




import Lead from '../Schema/lead.js';
import { sendLeadToSlack } from '../Services/slack.service.js';

export const createLead = async (req, res) => {
  try {
    // 1. Extract the specific data we want from the incoming request body
    const {
      source, urgency, userType, directLink, zone,
      leadType, locationStatus, city, careArrangement,
      potentialShareType, sharePotential, nannyStatus,
      leadTemperature, conversionPath, priorityTier, childAge
    } = req.body;

    // 2. Create a new lead using our Blueprint (Schema)
    const newLead = new Lead({
      source, urgency, userType, directLink, zone,
      leadType, locationStatus, city, careArrangement,
      potentialShareType, sharePotential, nannyStatus,
      leadTemperature, conversionPath, priorityTier, childAge
    });

    // 3. Save it to the database
    const savedLead = await newLead.save();

    // 4. Use our new Messenger Tool to send the alert to Slack!
    sendLeadToSlack(savedLead);

    // 5. Send a success message back to the scraper
    res.status(201).json({
      message: "Lead successfully saved and sent to Slack!",
      data: savedLead
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

import Lead from '../Schema/lead.js';
import { sendLeadToSlack } from '../Services/slack.service.js';

export const createLead = async (req, res) => {
  try {
    // 1. Extract the specific data we want from the incoming request body
    const { source, urgency, userType, directLink } = req.body;

    // 2. Create a new lead using our Blueprint (Schema)
    const newLead = new Lead({
      source,
      urgency,
      userType,
      directLink
    });

    // 3. Save it to the database
    const savedLead = await newLead.save();

    // 4. Use our new Messenger Tool to send the alert to Slack!
    // (We don't 'await' it because we don't want Make.com to wait for Slack to finish)
    sendLeadToSlack(savedLead);

    // 5. Send a success message back to the scraper (like Make.com)
    res.status(201).json({ 
      message: "Lead successfully saved and sent to Slack!", 
      data: savedLead 
    });

  } catch (err) {
    // If something goes wrong (e.g., they didn't provide an urgency), send an error
    res.status(500).json({ error: err.message });
  }
};

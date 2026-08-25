import Lead from "../Schema/lead.js";
import { sendLeadToSlack } from "../Services/slack.service.js";

export const createLead = async (req, res) => {
  try {
    const {
      source,
      urgency,
      userType,
      directLink,
      zone,
      leadType,
      locationStatus,
      city,
      careArrangement,
      potentialShareType,
      sharePotential,
      nannyStatus,
      leadTemperature,
      conversionPath,
      priorityTier,
      childAge,
      incomingMessage,
      name,
    } = req.body;

    if (!directLink) {
      return res.status(400).json({ error: "directLink is required" });
    }

    const setFields = {
      source: source || "FB",
      urgency,
      userType,
      zone,
      leadType,
      locationStatus,
      city,
      careArrangement,
      potentialShareType,
      sharePotential,
      nannyStatus,
      leadTemperature,
      conversionPath,
      priorityTier,
      childAge,
      incomingMessage,
      name,
    };

    // Strip undefined so we don't wipe existing fields on update
    Object.keys(setFields).forEach((k) => {
      if (setFields[k] === undefined) delete setFields[k];
    });

    const result = await Lead.updateOne(
      { directLink },
      {
        $set: setFields,
        $setOnInsert: { outreachStatus: "new" },
      },
      { upsert: true }
    );

    const savedLead = await Lead.findOne({ directLink });
    const created = Boolean(result.upsertedCount);

    try {
      await sendLeadToSlack(savedLead);
    } catch (slackErr) {
      console.error("Slack notify failed:", slackErr.message);
    }

    res.status(created ? 201 : 200).json({
      message: created
        ? "Lead successfully saved and sent to Slack!"
        : "Lead updated and sent to Slack!",
      data: savedLead,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

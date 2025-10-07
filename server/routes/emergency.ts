import type { RequestHandler } from "express";
import { loadDoctors } from "../services/excel";

export const handleEmergencyCall: RequestHandler = async (req, res) => {
  try {
    const { phone, description } = req.body as { phone: string; description?: string };
    console.log('[EMERGENCY] received', { phone, descriptionLength: description?.length });
    if (!phone) return res.status(400).json({ error: "phone_required" });

    const doctors = loadDoctors();
    const top = doctors[0];

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER; // required by Twilio
    console.log('[EMERGENCY] twilio env present?', !!sid, !!token, !!from);

    if (!sid || !token || !from) {
      console.warn('[EMERGENCY] Twilio not configured');
      return res.json({
        message:
          "Emergency acknowledged. Twilio is not configured. Please dial emergency services or contact a nearby doctor immediately.",
        doctor: top ?? null,
      });
    }

    if (!top?.phone) {
      console.warn('[EMERGENCY] No doctor available');
      return res.json({
        message: "No doctor available for emergency call. Please dial emergency services immediately.",
        doctor: null,
      });
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`;
    const basic = Buffer.from(`${sid}:${token}`).toString("base64");

    // Create a conference call that connects both user and doctor
    const conferenceId = `emergency-${Date.now()}`;
    
    // TwiML for the user call - they join the conference first
    const userTwiML = `<?xml version='1.0' encoding='UTF-8'?>
    <Response>
      <Say>SwasthyaAI Emergency Service. Connecting you to Dr. ${top.name}. Please hold while we connect the doctor.</Say>
      <Dial>
        <Conference startConferenceOnEnter="true" endConferenceOnExit="true">${conferenceId}</Conference>
      </Dial>
    </Response>`;

    // TwiML for the doctor call - they join the conference after user
    const doctorTwiML = `<?xml version='1.0' encoding='UTF-8'?>
    <Response>
      <Say>SwasthyaAI Emergency Call. A patient needs immediate medical assistance. ${description ? `Patient description: ${description.substring(0, 100)}` : ''}</Say>
      <Dial>
        <Conference startConferenceOnEnter="false" endConferenceOnExit="true">${conferenceId}</Conference>
      </Dial>
    </Response>`;

    // First, call the user
    const userCallBody = new URLSearchParams({ 
      From: from, 
      To: phone, 
      Twiml: userTwiML 
    });

    console.log('[EMERGENCY] calling user:', phone);
    const userCallResponse = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: userCallBody,
    });

    const userCallText = await userCallResponse.text();
    console.log('[EMERGENCY] user call response:', userCallResponse.status, userCallText);

    if (!userCallResponse.ok) {
      return res.status(500).json({ error: "user_call_failed", detail: userCallText });
    }

    // Wait a moment, then call the doctor
    setTimeout(async () => {
      try {
        const doctorCallBody = new URLSearchParams({ 
          From: from, 
          To: top.phone, 
          Twiml: doctorTwiML 
        });

        console.log('[EMERGENCY] calling doctor:', top.phone);
        const doctorCallResponse = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: doctorCallBody,
        });

        const doctorCallText = await doctorCallResponse.text();
        console.log('[EMERGENCY] doctor call response:', doctorCallResponse.status, doctorCallText);
      } catch (e) {
        console.error('[EMERGENCY] failed to call doctor:', e);
      }
    }, 3000); // 3 second delay to let user call establish first

    res.json({ 
      message: "Emergency calls initiated. Connecting you to the doctor.", 
      doctor: top,
      userCall: userCallText,
      conferenceId 
    });
  } catch (e: any) {
    console.error('[EMERGENCY] error', e);
    res.status(500).json({ error: "emergency_failed", detail: e?.message });
  }
};

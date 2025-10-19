// sip.js
const sip = require("sip");
const { sendMqttEvent } = require("./mqtt");

const pendingInvites = new Map();

sip.start({}, (request) => {
  const callKey =
    request.headers["call-id"] +
    (request.headers.from?.tag || "") +
    (request.headers.to?.tag || "");

  console.log("📩 SIP message received:", request.method);

  // --- REGISTER ---
  if (request.method === "REGISTER") {
    sip.send(sip.makeResponse(request, 200, "OK"));
    return;
  }

  // --- INVITE ---
  if (request.method === "INVITE") {
    console.log("🔔 Doorbell pressed:", request.headers.from?.uri);

    // Publish MQTT event
    sendMqttEvent({ eventName: "doorbellPressed", from: request.headers.from?.uri });

    // Reply early so device doesn't retry
    sip.send(sip.makeResponse(request, 100, "Trying"));
    sip.send(sip.makeResponse(request, 180, "Ringing"));

    // Save request for future timeout/cancel
    pendingInvites.set(callKey, request);

    // Timeout — terminate after 30s
    setTimeout(() => {
      const inviteReq = pendingInvites.get(callKey);
      if (!inviteReq) return; // already canceled or ended

      pendingInvites.delete(callKey);

      // Send 202 first (acknowledge)
      sip.send(sip.makeResponse(inviteReq, 202, "Accepted"));

      // Then terminate the call
      sip.send(sip.makeResponse(inviteReq, 487, "Request Terminated", inviteReq));

      // Send BYE to close session
      sip.send({
        method: "BYE",
        uri: inviteReq.headers.from.uri,
        headers: {
          to: inviteReq.headers.from,
          from: inviteReq.headers.to,
          "call-id": inviteReq.headers["call-id"],
          cseq: { method: "BYE", seq: inviteReq.headers.cseq.seq + 1 },
        },
      });

      console.log("⏰ Timeout — call auto-terminated (202 + 487 + BYE)");

      // sendMqttEvent({ type: "timeout", from: inviteReq.headers.from?.uri });
    }, 30000);

    return;
  }

  // --- CANCEL ---
  if (request.method === "CANCEL") {
    const inviteReq = pendingInvites.get(callKey);
    if (inviteReq) {
      pendingInvites.delete(callKey);

      sip.send(sip.makeResponse(inviteReq, 487, "Request Terminated", inviteReq));
      sip.send(sip.makeResponse(request, 200, "OK"));
      console.log("❌ Call canceled (487)");

      // sendMqttEvent({ type: "cancel", from: inviteReq.headers.from?.uri });
    }
    return;
  }

  // --- BYE ---
  if (request.method === "BYE") {
    sip.send(sip.makeResponse(request, 200, "OK"));
    pendingInvites.delete(callKey);
    console.log("📴 Call ended by device");

    // sendMqttEvent({ type: "bye", from: request.headers.from?.uri });
    return;
  }

  // --- OPTIONS or others ---
  sip.send(sip.makeResponse(request, 200, "OK"));
});

console.log("✅ SIP server running on UDP port 5060");

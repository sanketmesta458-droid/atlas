"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Mode = "mic" | "speaker" | "both";

export default function PhoneAudioPage() {
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState<Mode>("both");
  const [status, setStatus] = useState("Open this page from Atlas using the QR code or pairing link.");
  const [connected, setConnected] = useState(false);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setRoomId(new URLSearchParams(window.location.search).get("room") || "");
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      peerRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, []);

  const connect = () => {
    if (!roomId) return setStatus("This pairing link is missing its room code. Scan a new QR code from Atlas.");
    socketRef.current?.disconnect();
    peerRef.current?.close();
    const socket = io(window.location.origin, { path: "/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("join-audio-room", roomId);
      setStatus("Connected to Atlas signaling. Waiting for secure audio…");
    });
    socket.on("connect_error", () => setStatus("Can’t reach the signaling server. Make sure this phone opened Atlas’s pairing link."));
    socket.on("audio-signal", async (offer: RTCSessionDescriptionInit) => {
      if (offer.type !== "offer") return;
      try {
        const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peerRef.current = peer;
        peer.ondatachannel = (event) => {
          channelRef.current = event.channel;
          event.channel.onmessage = (message) => {
            try {
              const data = JSON.parse(message.data);
              if (data.type === "speech" && mode !== "mic") speechSynthesis.speak(new SpeechSynthesisUtterance(data.value));
            } catch { /* Ignore malformed data-channel messages. */ }
          };
        };
        peer.onconnectionstatechange = () => {
          if (peer.connectionState === "connected") { setConnected(true); setStatus("Connected securely with WebRTC."); }
          if (peer.connectionState === "failed") setStatus("The WebRTC connection failed. Return to Atlas and create a new pairing.");
        };
        await peer.setRemoteDescription(offer);
        if (mode !== "speaker") {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
          streamRef.current = stream;
          stream.getTracks().forEach((track) => peer.addTrack(track, stream));
        }
        await peer.setLocalDescription(await peer.createAnswer());
        await waitForIce(peer);
        socket.emit("audio-signal", { roomId, signal: peer.localDescription });
        setStatus("Finishing secure WebRTC connection…");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Could not start phone audio.");
      }
    });
  };

  const sendVoiceCommand = () => {
    const recognitionWindow = window as Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const Recognition = recognitionWindow.SpeechRecognition || recognitionWindow.webkitSpeechRecognition;
    if (!Recognition || !channelRef.current) return setStatus("Voice commands need Chrome or Edge after pairing.");
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript;
      channelRef.current?.send(JSON.stringify({ type: "command", value: command }));
      setStatus(`Sent: ${command}`);
    };
    recognition.onerror = () => setStatus("Phone voice command was not recognized.");
    recognition.start();
    setStatus("Listening for one command…");
  };

  return <main className="min-h-screen bg-slate-950 p-5 text-slate-100"><section className="mx-auto max-w-xl space-y-5 rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div><p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Atlas companion</p><h1 className="mt-1 text-2xl font-semibold">Phone audio bridge</h1><p className="mt-2 text-sm leading-6 text-slate-300">Choose what this phone should provide, then pair. Audio stays peer-to-peer over WebRTC; the server only introduces the devices.</p></div><fieldset className="grid gap-2"><legend className="mb-2 text-sm font-medium">Phone role</legend>{([ ["both", "Microphone + speaker", "Send your voice and hear Atlas"], ["mic", "Microphone only", "Send your voice to Atlas"], ["speaker", "Speaker only", "Hear Atlas, no microphone permission"] ] as const).map(([value, title, detail]) => <label key={value} className={`cursor-pointer rounded-xl border p-3 ${mode === value ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700"}`}><input className="mr-2 accent-cyan-400" type="radio" checked={mode === value} onChange={() => setMode(value)} disabled={connected} /> <span className="font-medium">{title}</span><span className="ml-1 text-xs text-slate-400">— {detail}</span></label>)}</fieldset><button onClick={connect} disabled={connected} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">{connected ? "Phone paired" : "Pair securely with Atlas"}</button>{connected && mode !== "speaker" && <button onClick={sendVoiceCommand} className="w-full rounded-xl border border-cyan-400 px-4 py-3 font-medium text-cyan-300">Send a voice command</button>}<p aria-live="polite" className="rounded-xl bg-slate-800 p-3 text-sm text-cyan-200">{status}</p></section></main>;
}

function waitForIce(peer: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (peer.iceGatheringState === "complete") return resolve();
    const timer = window.setTimeout(resolve, 3000);
    peer.onicegatheringstatechange = () => { if (peer.iceGatheringState === "complete") { clearTimeout(timer); resolve(); } };
  });
}

"use client";

import { io, Socket } from "socket.io-client";

type CommandHandler = (command: string) => void;
type StatusHandler = (status: string) => void;

/** WebRTC media with Socket.IO used only to exchange SDP/ICE signaling. */
class PhoneAudioBridge {
  private peer: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private commandHandler: CommandHandler | null = null;
  private streamHandler: ((stream: MediaStream) => void) | null = null;
  private statusHandler: StatusHandler | null = null;

  onCommand(handler: CommandHandler | null) { this.commandHandler = handler; }
  onRemoteStream(handler: ((stream: MediaStream) => void) | null) { this.streamHandler = handler; }
  onStatus(handler: StatusHandler | null) { this.statusHandler = handler; }
  get connected() { return this.channel?.readyState === "open"; }

  async createPairing() {
    this.close();
    this.roomId = crypto.randomUUID();
    const roomId = this.roomId;
    const link = new URL(`/phone-audio?room=${encodeURIComponent(roomId)}`, window.location.origin).toString();
    const socket = io(window.location.origin, { path: "/socket.io", transports: ["websocket", "polling"] });
    this.socket = socket;
    socket.on("connect", () => {
      socket.emit("join-audio-room", roomId);
      this.statusHandler?.("Waiting for your phone to join…");
    });
    socket.on("audio-peer-joined", () => void this.createOffer());
    socket.on("audio-signal", (signal: RTCSessionDescriptionInit) => void this.acceptSignal(signal));
    socket.on("connect_error", () => this.statusHandler?.("Signaling server unavailable. Start Atlas with npm run dev."));
    return { roomId, link };
  }

  send(type: string, value: string) {
    if (this.connected) this.channel?.send(JSON.stringify({ type, value }));
  }

  close() {
    this.channel?.close();
    this.peer?.close();
    this.socket?.disconnect();
    this.channel = null;
    this.peer = null;
    this.socket = null;
    this.roomId = null;
  }

  private async createOffer() {
    if (!this.socket || !this.roomId) return;
    this.channel?.close();
    this.peer?.close();
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    this.peer = peer;
    peer.addTransceiver("audio", { direction: "recvonly" });
    this.channel = peer.createDataChannel("atlas-control");
    this.bindChannel(this.channel);
    peer.ontrack = (event) => this.streamHandler?.(event.streams[0]);
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") this.statusHandler?.("Phone connected — WebRTC audio is live.");
      if (peer.connectionState === "failed") this.statusHandler?.("Phone connection failed. Re-scan the QR code to retry.");
    };
    await peer.setLocalDescription(await peer.createOffer());
    await this.waitForIce(peer);
    this.socket.emit("audio-signal", { roomId: this.roomId, signal: peer.localDescription });
    this.statusHandler?.("Phone found — negotiating secure audio…");
  }

  private async acceptSignal(signal: RTCSessionDescriptionInit) {
    if (!this.peer || signal.type !== "answer") return;
    await this.peer.setRemoteDescription(signal);
  }

  private bindChannel(channel: RTCDataChannel) {
    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "command" && typeof message.value === "string") this.commandHandler?.(message.value);
      } catch {}
    };
  }

  private waitForIce(peer: RTCPeerConnection) {
    return new Promise<void>((resolve) => {
      if (peer.iceGatheringState === "complete") return resolve();
      const timer = window.setTimeout(resolve, 2500);
      peer.onicegatheringstatechange = () => {
        if (peer.iceGatheringState === "complete") { clearTimeout(timer); resolve(); }
      };
    });
  }
}

export const phoneAudioBridge = new PhoneAudioBridge();

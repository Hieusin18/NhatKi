import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "SetLog Spec-Kit Engine" });
  });

  // Media Processing Pipeline
  app.post("/api/media/process", async (req, res) => {
    const { userId, filename, mediaType, inputDataUrl } = req.body;
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!inputDataUrl) {
      return res.status(400).json({ error: "inputDataUrl is required" });
    }

    try {
      let thumbnail = inputDataUrl;
      let medium = inputDataUrl;
      let full = inputDataUrl;

      const isVideo = mediaType === 'video_15s' || mediaType === 'clip_2s' || (typeof inputDataUrl === 'string' && inputDataUrl.startsWith("data:video/"));

      if (isVideo) {
        console.log(`[MediaPipeline] Processing raw video stream (${mediaType || 'video'}) passthrough for user ${userId || 'anonymous'}`);
      } else if (typeof inputDataUrl === 'string' && inputDataUrl.startsWith("data:image/")) {
        console.log(`[MediaPipeline] Processing image using Sharp compressor for user ${userId || 'anonymous'}`);
        const base64Data = inputDataUrl.split(";base64,").pop();
        if (base64Data) {
          const imageBuffer = Buffer.from(base64Data, "base64");

          // 1. Thumbnail (150x150)
          const thumbBuffer = await sharp(imageBuffer)
            .resize(150, 150, { fit: "cover" })
            .jpeg({ quality: 80 })
            .toBuffer();
          thumbnail = `data:image/jpeg;base64,${thumbBuffer.toString("base64")}`;

          // 2. Medium (600x600)
          const medBuffer = await sharp(imageBuffer)
            .resize(600, 600, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
          medium = `data:image/jpeg;base64,${medBuffer.toString("base64")}`;

          // 3. Full / Compressed
          const fullBuffer = await sharp(imageBuffer)
            .jpeg({ quality: 90 })
            .toBuffer();
          full = `data:image/jpeg;base64,${fullBuffer.toString("base64")}`;
        }
      }

      const mediaJob = {
        jobId,
        filename: filename || `media_${Date.now()}`,
        stage: "completed",
        progress: 100,
        userId: userId || "anonymous",
        outputUrls: {
          thumbnail,
          medium,
          full
        },
        storageTier: "hot_s3"
      };

      return res.json(mediaJob);
    } catch (err: any) {
      console.error("Error processing media pipeline:", err);
      return res.status(500).json({
        error: "Media processing failed",
        details: err?.message || String(err)
      });
    }
  });

  // GitHub Spec-Kit Spec Generator Endpoint
  app.post("/api/generate-spec", async (req, res) => {
    const { prompt, category } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are a GitHub Spec-Kit Architect.
Generate a complete, standard GitHub Spec-Kit specification for the app SetLog (a 2-second video daily vlog app, competitor to Locket).
Category: ${category || 'feature'}

You MUST reply with ONLY a raw valid JSON object matching this schema:
{
  "id": "spec-slug",
  "title": "Title of Spec",
  "version": "1.0.0",
  "author": "GitHub Spec-Kit AI",
  "description": "Short description",
  "userStories": ["Story 1", "Story 2"],
  "requirements": [
    { "id": "REQ-1", "title": "Req Title", "description": "Req Description", "priority": "high|medium|low" }
  ],
  "architecture": {
    "frontend": "Frontend stack details",
    "backend": "Backend & API logic",
    "dataModel": "TypeScript interfaces/code"
  },
  "acceptanceCriteria": [
    { "id": "AC-1", "description": "Criteria description", "status": "passed|pending" }
  ],
  "edgeCases": ["Edge case 1"],
  "markdown": "# Markdown version of spec"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Create a GitHub Spec-Kit spec for SetLog feature: ${prompt}`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json(parsed);
        }
      } catch (err: any) {
        console.error("Gemini Spec-Kit API error:", err?.message || err);
      }
    }

    // Fallback template generator
    const cleanPrompt = prompt.trim();
    const slug = cleanPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
    const mockSpec = {
      id: `spec-${slug || 'feature'}`,
      title: `Quy chuẩn Spec-Kit: ${cleanPrompt}`,
      version: '1.0.0',
      author: 'GitHub Spec-Kit Engine',
      description: `Tài liệu thiết kế quy chuẩn (Specification-Driven Development) cho tính năng "${cleanPrompt}" trong SetLog.`,
      userStories: [
        `Là người dùng SetLog, tôi muốn ${cleanPrompt} để lưu trữ khoảnh khắc 2 giây hàng ngày sinh động hơn.`,
        `Là thành viên phòng nhóm (tối đa 12 người), tôi muốn thấy sự thay đổi ${cleanPrompt} hiển thị ngay lập tức.`,
        `Là lập trình viên, tôi muốn có bộ tiêu chí kiểm thử (Acceptance Criteria) tự động cho tính năng này.`
      ],
      requirements: [
        { id: "REQ-01", title: "Giới hạn Khung hình & Thời lượng", description: "Thời lượng video cố định chính xác 2.0 giây, độ phân giải vuông 1:1.", priority: "high" },
        { id: "REQ-02", title: "Đồng bộ Real-time nhóm 12 người", description: "Dữ liệu được phát trực tiếp tới tất cả thành viên trong phòng cùng mã PIN.", priority: "high" },
        { id: "REQ-03", title: "Tích hợp Daily Vlog Stitcher", description: "Các clip mới phải sẵn sàng ghép nối tự động theo mốc thời gian 07:00, 11:00, 15:00, 18:00...", priority: "medium" }
      ],
      architecture: {
        frontend: "React 19 + Tailwind CSS v4 + Motion animation layer. Quản lý trạng thái bằng React Hooks & Context.",
        backend: "Node.js Express proxy với Google GenAI Gemini 2.5 Flash SDK.",
        dataModel: `interface SpecFeatureLog {\n  id: string;\n  featureName: string;\n  status: 'draft' | 'active' | 'verified';\n  specRules: {\n    maxDurationSec: 2.0;\n    maxRoomMembers: 12;\n  };\n}`
      },
      acceptanceCriteria: [
        { id: "AC-01", description: "Quay video 2s hoạt động ổn định và phát âm thanh Shutter.", status: "passed" },
        { id: "AC-02", description: "Phòng nhóm duy trì đúng giới hạn tối đa 12 thành viên.", status: "passed" },
        { id: "AC-03", description: "Tạo file xuất dạng Markdown (.md) hoặc Spec JSON đạt chuẩn Spec-Kit.", status: "passed" }
      ],
      edgeCases: [
        "Mất kết nối camera: Chuyển tự động sang chế độ mô phỏng Simulated Clip (8 chủ đề).",
        "Mã PIN không đúng: Báo lỗi và không cho phép truy cập dữ liệu phòng riêng tư."
      ],
      markdown: `# Specification: ${cleanPrompt}\n\n**Spec ID:** \`spec-${slug}\`  \n**Version:** 1.0.0  \n**Status:** Draft  \n\n## 1. User Stories\n- As a user, I want ${cleanPrompt} to record daily 2-second memories.\n\n## 2. Technical Architecture\n- Front-end: React 19, Motion, Tailwind v4\n- Back-end: Express + Gemini Spec Generator\n\n## 3. Verification Criteria\n- [x] REQ-01: 2.0s video duration lock\n- [x] REQ-02: Max 12 members per room\n- [ ] REQ-03: Live spec checklist validation\n`
    };

    return res.json(mockSpec);
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

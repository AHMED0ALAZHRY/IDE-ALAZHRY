import express from "express";
import { createServer as createViteServer } from "vite";
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let resendClient: Resend | null = null;
  function getResend() {
    if (!resendClient) {
      const key = process.env.RESEND_API_KEY;
      if (key) {
        resendClient = new Resend(key);
      }
    }
    return resendClient;
  }

  app.post("/api/send-booking-email", async (req, res) => {
    const { to, userName, guideName, monumentName, date, time } = req.body;
    
    const resend = getResend();
    
    if (!resend) {
      console.log("Mock Email Status: NO API KEY PROVIDED.");
      console.log("Would have sent message to:", to);
      return res.status(200).json({ success: true, note: "missing_key" });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'Athar Booking <onboarding@resend.dev>',
        to: [to],
        subject: 'تأكيد حجز مرشد سياحي مبدئياً - أثر',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; color: #1A365D; background-color: #F8FAFC; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 600px; margin: 0 auto;">
                <h2 style="color: #D4AF37; text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 15px; margin-bottom: 20px;">
                    أهلاً بك في رحلة عبر الزمن
                </h2>
                <h3 style="margin-top: 0;">مرحباً ${userName}،</h3>
                <p style="font-size: 16px; line-height: 1.6;">سعادتنا لا توصف بكونك جزءاً من رحلة <strong>أثر</strong> التاريخية.</p>
                <p style="font-size: 16px; line-height: 1.6;">لقد تلقينا طلب حجزك لمرشد سياحي بنجاح، وإليك تفاصيل الجولة:</p>
                
                <ul style="background: #F1F5F9; padding: 20px 20px 20px 40px; border-radius: 8px; list-style: none; margin: 25px 0;">
                  <li style="margin-bottom: 10px;"><strong>🏛️ المعلم المختار:</strong> ${monumentName}</li>
                  <li style="margin-bottom: 10px;"><strong>👤 المرشد المفضل:</strong> ${guideName}</li>
                  <li style="margin-bottom: 10px;"><strong>📅 التاريخ:</strong> ${date}</li>
                  <li><strong>⏰ الوقت المقترح:</strong> ${time}</li>
                </ul>
                
                <p style="font-size: 16px; line-height: 1.6;">سيقوم فريق تنظيم الجولات لدينا بالتواصل معك قريباً لتأكيد الموعد النهائي للجولة واعتماد الحجز.</p>
                <p style="font-size: 16px; line-height: 1.6;">شكراً لثقتك بنا.<br/><br/><strong style="color: #D4AF37;">فريق أثر</strong></p>
            </div>
          </div>
        `
      });

      if (error) {
        return res.status(400).json({ error });
      }
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

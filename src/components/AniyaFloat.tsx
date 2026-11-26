import { useState } from "react";
import { Drawer } from "antd";
import {
  ApiOutlined,
  CalendarOutlined,
  CloudServerOutlined,
  CodeOutlined,
  FacebookFilled,
  GlobalOutlined,
  InstagramOutlined,
  LinkedinFilled,
  MailOutlined,
  PhoneOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  TwitterOutlined,
  WhatsAppOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import DemoVideo from "./DemoVideo";

const SITE = "https://aniyanetworks.net/";
const BOOK = "https://zcal.co/aniyanetworks/30min";

const services = [
  { icon: <ThunderboltOutlined />, title: "GoHighLevel automation", text: "Accounts, pipelines, funnels and snapshots built, fixed and automated." },
  { icon: <ApiOutlined />, title: "n8n & Make.com workflows", text: "Multi-step automations and API integrations with proper error handling." },
  { icon: <RobotOutlined />, title: "AI receptionist & voice agents", text: "Answers calls 24/7, books appointments and follows up with every lead." },
  { icon: <CodeOutlined />, title: "Custom SaaS & full-stack builds", text: "Dashboards, portals and APIs tailored to how your business works." },
  { icon: <CloudServerOutlined />, title: "DevOps & cloud", text: "Reliable cloud architecture, deployment and monitoring." },
];

const stats = [
  ["100+", "workflows automated"],
  ["40%", "less manual admin"],
  ["Top Rated Plus", "on Upwork"],
];

const socials = [
  { icon: <LinkedinFilled />, href: "https://www.linkedin.com/company/aniyanetworks", label: "LinkedIn" },
  { icon: <InstagramOutlined />, href: "https://www.instagram.com/aniyanetworks", label: "Instagram" },
  { icon: <YoutubeOutlined />, href: "https://www.youtube.com/@aniyanetworks8844", label: "YouTube" },
  { icon: <TwitterOutlined />, href: "https://x.com/aniyanetworks", label: "X" },
  { icon: <FacebookFilled />, href: "https://www.facebook.com/aniyanetworks", label: "Facebook" },
];

const AniyaFloat = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="About Aniya Networks"
        title="About AniyaNetworks"
        className="group fixed right-0 top-1/2 z-[1000] flex -translate-y-1/2 items-center rounded-l-full bg-[#0b3b38] py-1.5 pl-1.5 pr-1.5 text-white shadow-lg ring-1 ring-white/10 transition-all duration-300 hover:pr-4"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[12px] font-extrabold text-[#0b3b38]">AN</div>
        <div className="max-w-0 overflow-hidden whitespace-nowrap text-left leading-tight opacity-0 transition-all duration-300 group-hover:ml-2.5 group-hover:max-w-[150px] group-hover:opacity-100">
          <div className="text-[10px] uppercase tracking-wider text-teal-200">Powered by</div>
          <div className="text-[12px] font-semibold">AniyaNetworks</div>
        </div>
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} width={420} title={null} closable styles={{ body: { padding: 0 } }}>
        {/* header */}
        <div className="bg-[#0b3b38] px-6 pb-6 pt-8 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-[18px] font-extrabold text-[#0b3b38]">AN</div>
            <div>
              <div className="text-[17px] font-bold leading-tight">Aniya Network Solutions Inc.</div>
              <div className="text-[12px] text-teal-200">Cambridge, Ontario · Serving Canada, US, UK &amp; EU</div>
            </div>
          </div>
          <p className="mt-4 text-[14px] font-medium leading-snug text-white">
            AI-driven workflow orchestration for scalable business systems.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-teal-100/80">
            We design and build AI automation and custom integrations that connect your sales, operations and client
            communication, so your team spends time on clients, not on admin.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {stats.map(([n, l]) => (
              <div key={l} className="rounded-lg bg-white/10 px-2 py-2.5 text-center">
                <div className="text-[14px] font-bold leading-tight text-amber-300">{n}</div>
                <div className="mt-0.5 text-[10px] leading-tight text-teal-100/80">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {/* walkthrough video */}
          <div className="-mx-6 -mt-6 bg-[#0b3b38] px-6 pb-6 pt-1">
            <DemoVideo label="Watch the product walkthrough" />
          </div>

          {/* this product */}
          <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
            <div className="text-[13px] font-semibold text-[#0b3b38]">About this demo</div>
            <p className="mt-1 text-[12px] leading-relaxed text-gray-600">
              ANS RealStateCRM is a working prototype of a real estate CRM built by Aniya Network Solutions. We can tailor
              it to your brokerage and connect it to the tools you already use.
            </p>
          </div>

          {/* services */}
          <div>
            <div className="mb-3 text-[13px] font-semibold text-gray-800">What we can build for you</div>
            <div className="space-y-2.5">
              {services.map((s) => (
                <div key={s.title} className="flex gap-3 rounded-lg border border-gray-100 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[16px] text-[#0f766e]">{s.icon}</div>
                  <div>
                    <div className="text-[13px] font-semibold text-gray-800">{s.title}</div>
                    <div className="mt-0.5 text-[12px] leading-snug text-gray-500">{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* call to action */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={BOOK}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#0d6b64]"
            >
              <CalendarOutlined /> Book a free 30-minute call
            </a>
            <a
              href={SITE}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-700 transition hover:border-[#0f766e] hover:text-[#0f766e]"
            >
              <GlobalOutlined /> Visit website
            </a>
            <a
              href="https://wa.me/message/NLGRYY6ZVXPPC1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-700 transition hover:border-[#0f766e] hover:text-[#0f766e]"
            >
              <WhatsAppOutlined /> WhatsApp
            </a>
          </div>

          {/* contact */}
          <div>
            <div className="mb-2 text-[13px] font-semibold text-gray-800">Contact</div>
            <ul className="space-y-2 text-[13px] text-gray-600">
              <li className="flex items-center gap-2.5">
                <MailOutlined className="text-[#0f766e]" />
                <a href="mailto:info@aniyanetworks.net" className="hover:text-[#0f766e] hover:underline">info@aniyanetworks.net</a>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneOutlined className="text-[#0f766e]" />
                <a href="tel:+14377778844" className="hover:text-[#0f766e] hover:underline">+1 (437) 777-8844</a>
                <span className="text-[11px] text-gray-400">consultations</span>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneOutlined className="text-[#0f766e]" />
                <a href="tel:+14374764488" className="hover:text-[#0f766e] hover:underline">+1 (437) 476-4488</a>
                <span className="text-[11px] text-gray-400">AI live demo line</span>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[16px] text-gray-600 transition hover:bg-[#0f766e] hover:text-white"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default AniyaFloat;

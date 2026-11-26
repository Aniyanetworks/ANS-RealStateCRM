// Walkthrough video of the product, hosted on Google Drive (shared with "anyone with the link").
const DRIVE_FILE_ID = "1I3aZWJ5hCdhg0Uc6OtqnbTcfh0Pdbvkl";

type Props = { className?: string; label?: string };

const DemoVideo = ({ className = "", label = "Watch the product walkthrough" }: Props) => (
  <div className={className}>
    {label ? <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-amber-400">{label}</div> : null}
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-lg" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        src={`https://drive.google.com/file/d/${DRIVE_FILE_ID}/preview`}
        title="ANS RealStateCRM walkthrough video"
        className="h-full w-full"
        allow="autoplay; fullscreen"
        allowFullScreen
        loading="lazy"
      />
    </div>
  </div>
);

export default DemoVideo;

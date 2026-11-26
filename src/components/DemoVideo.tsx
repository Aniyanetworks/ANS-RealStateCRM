// Product walkthrough video, served from /public (compressed copy of the full render).
type Props = { className?: string; label?: string };

const DemoVideo = ({ className = "", label = "Watch the product walkthrough" }: Props) => (
  <div className={className}>
    {label ? <div className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-amber-400">{label}</div> : null}
    <div className="overflow-hidden rounded-xl bg-[#04201d] shadow-lg ring-1 ring-white/10" style={{ aspectRatio: "16 / 9" }}>
      <video
        className="block h-full w-full object-cover"
        src="/walkthrough.mp4"
        poster="/walkthrough-poster.jpg"
        controls
        playsInline
        preload="none"
        controlsList="nodownload noplaybackrate"
      />
    </div>
  </div>
);

export default DemoVideo;

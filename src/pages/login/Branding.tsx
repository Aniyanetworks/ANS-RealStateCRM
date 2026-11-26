import logoIcon from "/logo-icon.svg";

const features = [
  "Leads, clients and listings in one place",
  "Trade sheets from offer to closing",
  "Agent commissions, accounting and reports",
];

const Branding = () => {
  return (
    <div
      className="hidden sm:w-[25%] md:min-w-[380px] lg:w-[40%] sm:flex items-center justify-center px-10 2xl:px-20 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #072f2d 0%, #0b3b38 45%, #0f766e 100%)" }}
    >
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-teal-400/10" />
      <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-amber-400/10" />

      <div className="relative flex flex-col gap-10 max-w-[420px]">
        <div className="flex flex-col items-center gap-4">
          <img src={logoIcon} alt="ANS RealStateCRM" className="w-[84px] h-[84px] drop-shadow-lg" />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-wide leading-tight">
              ANS <strong className="text-amber-400 font-bold">RealStateCRM</strong>
            </h1>
            <p className="mt-2 text-teal-100/80 text-sm">
              The all-in-one workspace for modern real estate teams.
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {features.map((text) => (
            <li
              key={text}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[#072f2d] text-xs font-bold">
                ✓
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Branding;

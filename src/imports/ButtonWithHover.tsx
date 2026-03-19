import svgPaths from "./svg-y6riuvtp0f";

export default function ButtonWithHover() {
  return (
    <div className="relative size-full" data-name="button with hover">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] left-[82px] not-italic text-[#0f0f0f] text-[18px] top-[28px] whitespace-nowrap">
        <p className="leading-[normal]">Messages</p>
      </div>
      <div className="-translate-y-1/2 absolute left-[34px] size-[24px] top-1/2" data-name="comments">
        <div className="absolute inset-0 overflow-clip" data-name="comments">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24.0006">
            <path d={svgPaths.p1d01c080} fill="var(--fill-0, #75797B)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}
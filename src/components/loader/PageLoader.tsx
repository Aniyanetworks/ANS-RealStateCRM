import "./pageloader.css";
const PageLoader = () => {
  return (
    <div>
      <div className="flex flex-col min-h-screen">
        <div className="preloader">
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path
              id="preloaderSvg"
              d="M0,1005S175,995,500,995s500,5,500,5V0H0Z"
            ></path>
          </svg>

          <div className="preloader-heading">
            <div className="load-text text-white font-bold playfair-display-sc-regular  text-[48px]">
              <span>L</span>
              <span>O</span>
              <span>A</span>
              <span>D</span>
              <span>I</span>
              <span>N</span>
              <span>G</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;

import welcomeImage from "./../../assets/dashboard.png";
const Welcome = () => {
  return (
    <div className="bg-white rounded-2xl mt-5">
      <img
        className="rounded-t-2xl w-full"
        src={welcomeImage}
        alt="welcome-image"
      />

      <div className="p-5">
        <h2 className=" font-medium">
          Welcome to Dream Valley Realty's Agent's Hub,
        </h2>
        <p className="mt-3">
          Welcome to Dream Valley Realty's Agent's Hub, your go-to resource for
          everything you need to succeed. Easily access and manage essential
          documents, upload trade sheets, and explore a rich library of training
          materials and videos. Our intuitive platform ensures you have the
          tools and support to thrive in your real estate career. Join us today
          and elevate your professional journey with DreamValley Realty
        </p>
      </div>
    </div>
  );
};

export default Welcome;

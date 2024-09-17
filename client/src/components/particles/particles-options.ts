const particlesOptions = {
  fullScreen: {
    enable: true,
  },
  fpsLimit: 120,
  interactivity: {
    events: {
      onClick: {
        enable: true,
        mode: "push",
      },
      onHover: {
        enable: true,
        mode: "repulse",
      },
    },
    modes: {
      push: {
        quantity: 1,
      },
      repulse: {
        distance: 100,
        duration: 0.4,
      },
    },
  },
  particles: {
    links: {
      enable: false,
    },
    move: {
      enable: true,
      speed: 1,
    },
    number: {
      value: 25,
    },
    opacity: {
      value: { min: 0.1, max: 0.8 },
    },
    shape: {
      type: ["image", "iamge"],
      options: {
        image: [
          // {
          //   src: "/logo.svg",
          //   width: 500,
          //   height: 500,
          // },
          {
            src: "/logo_line.svg",
            width: 500,
            height: 500,
          },
        ],
      },
    },
    size: {
      value: { min: 5, max: 50 },
    },
  },
};

export default particlesOptions;

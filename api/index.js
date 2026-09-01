module.exports = (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "LifeTrack Email Microservice",
    endpoint: "/api/send-email",
    methods: ["POST"],
  });
};

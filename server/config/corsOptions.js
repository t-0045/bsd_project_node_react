const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || true,
  credentials: true,
};

module.exports = corsOptions;
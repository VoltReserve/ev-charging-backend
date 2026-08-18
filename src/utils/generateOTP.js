const generateOTP = () => {
  if (process.env.FIXED_OTP) {
    return process.env.FIXED_OTP;
  }

  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default generateOTP;

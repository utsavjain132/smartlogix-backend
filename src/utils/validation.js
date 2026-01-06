const validateFields = (data, requiredFields) => {
  const missing = [];
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      missing.push(field);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

module.exports = { validateFields };

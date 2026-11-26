import { useState, useCallback } from "react";

// useCaptcha hook
const useCaptcha = () => {
  const generateCaptcha = () => {
    let firstValue = Math.floor(Math.random() * 10);
    let secondValue = Math.floor(Math.random() * 10);

    const operator = Math.random() > 0.5 ? "+" : "-";

    if (firstValue < secondValue) {
      [firstValue, secondValue] = [secondValue, firstValue];
    }

    const result =
      operator === "+" ? firstValue + secondValue : firstValue - secondValue;

    return { firstValue, secondValue, operator, result };
  };

  const [captcha, setCaptcha] = useState(generateCaptcha());

  const resetCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
  }, []);

  return {
    firstValue: captcha.firstValue,
    secondValue: captcha.secondValue,
    operator: captcha.operator,
    result: captcha.result,
    resetCaptcha,
  };
};

export default useCaptcha;

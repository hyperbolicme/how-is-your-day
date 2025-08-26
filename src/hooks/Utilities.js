const DAY_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const getCurrentTime = () => {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const getCurrentDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getDayOfWeek = (given) => {
  const today = new Date();
  const givenDay = new Date(given);
  const diff = givenDay.getTime() - today.getTime(); // in ms
  const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));

  if (diffDays == 0) {
    return "Today";
  } else if (diffDays == 1) {
    return "Tomorrow";
  } else if (diffDays > 1) {
    return DAY_OF_WEEK[givenDay.getDay()];
  }
};

export const getLocalTime = (unixtime) => {
    const d = new Date(unixtime * 1000);
    const formattedString = `${d.getHours()}:${d.getMinutes()}`;
    return formattedString;
  };

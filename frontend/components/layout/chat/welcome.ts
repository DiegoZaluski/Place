/*
  Creates a welcome greeting based on the app's time and location.
  return: Object
*/

function welcome() {
  const time:number = new Date().getHours()
  switch(true) {
    case (time >= 6 && time <= 12): {
      return "morning";
    }
    case (time >12 && time <= 20): {
      return "afternoon";
    }
    default: {
      return "night";
    }
  }

}
export default welcome
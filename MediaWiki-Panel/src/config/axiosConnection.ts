import axios from "axios";

const axiosConn = axios.create({
  baseURL: "http://localhost:7060/",
  headers: {
    "Content-Type": "application/json"
  }
});

export default axiosConn;
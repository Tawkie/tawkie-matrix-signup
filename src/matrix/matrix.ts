import axios from 'axios';

// handle single Matrix server for now
const baseUrl = process.env.MATRIX_ADMIN_BASE_URL ?? 'http://127.0.0.1:8008/_synapse/';
const accessToken = process.env.MATRIX_ADMIN_ACCESS_TOKEN ?? 'syt_foobar';

export const getServerVersion = async (): Promise<string> => {
  const response = await axios.get(baseUrl + 'admin/v1/server_version', {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
  // let function caller handle the error
  return response.data.server_version;
}

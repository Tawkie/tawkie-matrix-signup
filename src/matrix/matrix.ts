import axios from 'axios';

// handle single Matrix server for now
const matrixServerName = process.env.MATRIX_SERVER_NAME ?? 'matrix.staging.tawkie.fr';
const baseUrl = process.env.MATRIX_ADMIN_BASE_URL ?? 'http://127.0.0.1:8008/_synapse/';
const accessToken = process.env.MATRIX_ADMIN_ACCESS_TOKEN ?? 'syt_foobar';

export const matrixServerList = [matrixServerName];

export const getServerVersion = async (): Promise<string> => {
  const response = await axios.get(baseUrl + 'admin/v1/server_version', {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
  // let function caller handle the error
  return response.data.server_version;
}

/**
 * Create a user on the Matrix server
 * @param userId A fully-qualified user id. For example, `@user:server.com`.
 * @returns The HTTP status code of the response.
 * @throws An error if the user could not be created.
 * @see https://matrix-org.github.io/synapse/latest/admin_api/user_admin_api.html
 */
export const createUser = async (userId: string, serverName: string): Promise<number> => {
  if (!matrixServerList.includes(serverName)) {
    throw new Error('Server name is not recognised');
  }

  // TODO support multiple servers
  const response = await axios.put(baseUrl + 'admin/v2/users/' + userId, {
    admin: false,
  }, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
  // let function caller handle the error
  return response.status;
}

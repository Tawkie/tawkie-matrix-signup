import axios from 'axios';

// handle single Matrix server for now
const matrixServerName = process.env.MATRIX_SERVER_NAME ?? 'matrix.staging.tawkie.fr';
const baseUrl = process.env.MATRIX_ADMIN_BASE_URL ?? 'http://127.0.0.1:8008/_synapse/';
const accessToken = process.env.MATRIX_ADMIN_ACCESS_TOKEN ?? 'syt_foobar';

export const matrixServerList = [matrixServerName, 'matrix.alpha.tawkie.fr', 'matrix.loveto.party'];

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
 * @param userId localpart of the user. For example, `user`.
 * @param serverName The server name of the user. For example, `server.com`.
 * @returns The HTTP status code of the response.
 * @throws An error if the user could not be created.
 * @see https://matrix-org.github.io/synapse/latest/admin_api/user_admin_api.html
 */
export const createUser = async (userId: string, serverName: string): Promise<number> => {
  if (!matrixServerList.includes(serverName)) {
    throw new Error('Server name is not recognised');
  }
  if (!userId) {
    throw new Error('User does not have a username');
  }

  if (serverName.includes('matrix.')) {
    serverName = serverName.replace('matrix.', '');
  }

  const matrixId = `@${userId}:${serverName}`

  // TODO support multiple servers
  const response = await axios.put(baseUrl + 'admin/v2/users/' + matrixId, {
    admin: false,
  }, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
  // let function caller handle the error
  return response.status;
}

/**
 * Check if a user exists on the Matrix server
 * @param userId localpart of the user. For example, `user`.
 * @param serverName The server name of the user. For example, `server.com`.
 * @returns boolean indicating if the user exists.
 * @throws An error if the user could not be checked.
 * @see https://matrix-org.github.io/synapse/latest/admin_api/user_admin_api.html
 */
export const userExists = async (userId: string, serverName = matrixServerName): Promise<boolean> => {
  if (!matrixServerList.includes(serverName)) {
    throw new Error('Server name is not recognised');
  }
  if (!userId) {
    throw new Error('User does not have a username');
  }

  if (serverName.includes('matrix.')) {
    serverName = serverName.replace('matrix.', '');
  }

  const matrixId = `@${userId}:${serverName}`

  // TODO support multiple servers
  const response = await axios.get(baseUrl + 'admin/v2/users/' + matrixId, {
    headers: {
      'Authorization': 'Bearer ' + accessToken
    }
  })
  // let function caller handle the error
  return response.status === 200;
}

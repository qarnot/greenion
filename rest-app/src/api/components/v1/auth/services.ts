import { oidcApi } from '@services/ory';
import { decode } from '@services/jwt';
import { getUsers } from '@services/catalog';

async function getUserInfo(jwt: string) {
  const decodedJWT = decode<{ scp: string[]; sub: string }>(jwt);
  const { data } = await oidcApi.getOidcUserInfo({ headers: { Authorization: `Bearer ${jwt}` } });
  const [user] = await getUsers(decodedJWT.sub, { accessToken: jwt });
  const payload = {
    email: data.email,
    role: decodedJWT.scp.includes('admin') ? 'admin' : 'user',
    id: user.id,
  };
  return payload;
}

export { getUserInfo };

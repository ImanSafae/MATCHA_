const backUrl = "http://localhost:3000";

interface RequestData {
  [key: string]: any;
}

function getToken(): string | null {
  return sessionStorage.getItem('token');
}

async function httpPOST(route: string, data: RequestData): Promise<Response> {
  const token = getToken();
  const response = await fetch(`${backUrl}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  return response;
}

async function httpGET(route: string, params?: RequestData): Promise<Response> {
  const token = getToken();
  const url = new URL(`${backUrl}${route}`);
  if (params) {
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  return response;
}

async function httpPATCHmultipart(route: string, data: FormData): Promise<Response> {
  const token = getToken();
  const response = await fetch(`${backUrl}${route}`, {
    method: 'PATCH',
    body: data,
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  return response;
}

async function httpPATCH(route: string, data: RequestData): Promise<Response> {
  const token = getToken();
  const response = await fetch(`${backUrl}${route}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });
  return response;
}

async function httpDELETE(route: string, params?: RequestData): Promise<Response> {
  const token = getToken();
  const url = new URL(`${backUrl}${route}`);
  if (params) {
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });
  return response;
}

export { httpPOST, httpGET, httpPATCH, httpDELETE, httpPATCHmultipart, backUrl };

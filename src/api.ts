const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("Not Found");
  }
}

function checkStatus(response: Response) {
  if (response.status === 401) {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
    throw new UnauthorizedError();
  }
  if (response.status === 404) {
    throw new NotFoundError();
  }
  return response;
}

export type LoginResponse = {
  jwt: string;
};

/**
 * Authenticate the user with the given credentials
 * @param username
 * @param password
 * @returns
 */
export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  return await fetch(`${BASE_URL}/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  }).then((res) => checkStatus(res).json());
}

export type GetUserByIdResponse = {
  id: string;
  username: string;
  pictureUrl: string;
};

const cachedUsers: Record<string, GetUserByIdResponse> = {};
const cachedUserPromises: Map<string, Promise<GetUserByIdResponse>> = new Map();
/**
 * Get a user by their id
 * @param token
 * @param id
 * @returns
 */
export async function getUserById(
  token: string,
  id: string
): Promise<GetUserByIdResponse> {
  if (cachedUsers[id]) {
    return cachedUsers[id];
  }

  if (cachedUserPromises.has(id)) {
    return cachedUserPromises.get(id)!;
  }

  const userPromise = fetch(`${BASE_URL}/users/${id}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => checkStatus(res).json())
    .then((user) => {
      cachedUsers[id] = user;
      cachedUserPromises.delete(id);
      return user;
    })
    .catch((err) => {
      cachedUserPromises.delete(id);
      throw err;
    });

  cachedUserPromises.set(id, userPromise);
  return userPromise;
}

export type GetMemesResponse = {
  total: number;
  pageSize: number;
  results: {
    id: string;
    authorId: string;
    pictureUrl: string;
    description: string;
    commentsCount: string;
    texts: {
      content: string;
      x: number;
      y: number;
    }[];
    createdAt: string;
  }[];
};

/**
 * Get the list of memes for a given page
 * @param token
 * @param page
 * @returns
 */
export async function getMemes(
  token: string,
  page: number
): Promise<GetMemesResponse> {
  return await fetch(`${BASE_URL}/memes?page=${page}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => checkStatus(res).json());
}

export type GetMemeCommentsResponse = {
  total: number;
  pageSize: number;
  results: {
    id: string;
    authorId: string;
    memeId: string;
    content: string;
    createdAt: string;
  }[];
};

/**
 * Get comments for a meme
 * @param token
 * @param memeId
 * @returns
 */
export async function getMemeComments(
  token: string,
  memeId: string,
  page: number
): Promise<GetMemeCommentsResponse> {
  return await fetch(`${BASE_URL}/memes/${memeId}/comments?page=${page}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then((res) => checkStatus(res).json());
}

export type CreateCommentResponse = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  memeId: string;
};

/**
 * Create a comment for a meme
 * @param token
 * @param memeId
 * @param content
 */
export async function createMemeComment(
  token: string,
  memeId: string,
  content: string
): Promise<CreateCommentResponse> {
  return await fetch(`${BASE_URL}/memes/${memeId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  }).then((res) => checkStatus(res).json());
}

export type CreateMemeResponse = {
  id: string;
  authorId: string;
  pictureUrl: string;
  description: string;
  texts: {
    content: string;
    x: number;
    y: number;
  }[];
  commentsCount: number;
  createdAt: string;
};

/**
 * Create a meme
 * @param token
 * @param picture Binary data for the picture
 * @param description Description of the meme
 * @param texts Array of texts with their positions
 * @returns
 */
export async function createMeme(
  token: string,
  picture: File,
  description: string,
  texts: { content: string; x: number; y: number }[]
): Promise<CreateMemeResponse> {
  const formData = new FormData();

  formData.append("Picture", picture);
  formData.append("Description", description);

  texts.forEach((text, index) => {
    formData.append(`Texts[${index}][Content]`, text.content);
    formData.append(`Texts[${index}][X]`, text.x.toString());
    formData.append(`Texts[${index}][Y]`, text.y.toString());
  });

  return await fetch(`${BASE_URL}/memes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  }).then((res) => checkStatus(res).json());
}
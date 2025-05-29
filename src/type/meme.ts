import { GetMemesResponse, GetUserByIdResponse, GetMemeCommentsResponse } from "../api";

export type MemeWithAuthor = GetMemesResponse["results"][number] & {
  author: GetUserByIdResponse;
  comments?: (GetMemeCommentsResponse["results"][number] & {
    author: GetUserByIdResponse;
  })[];
};
export const mockToken = [
    btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })),
    btoa(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600,
        id: "dummy_user_id",
      })
    ),
    "signature",
  ].join(".");
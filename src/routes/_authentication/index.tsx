import {
  Avatar,
  Box,
  Collapse,
  Flex,
  Icon,
  Input,
  LinkBox,
  LinkOverlay,
  StackDivider,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CaretDown, CaretUp, Chat } from "@phosphor-icons/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useRef, useState } from "react";
import { format } from "timeago.js";

import {
  createMemeComment,
  getMemeComments,
  getMemes,
  getUserById,
} from "../../api";
import { Loader } from "../../components/loader";
import { MemePicture } from "../../components/meme-picture";
import { useAuthToken } from "../../contexts/authentication";
import { MemeWithAuthor } from "../../type/meme";

export const MemeFeedPage: React.FC = () => {
  const token = useAuthToken();
  const [memes, setMemes] = useState<MemeWithAuthor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [openedCommentSection, setOpenedCommentSection] = useState<
    string | null
  >(null);
  const [loadingComments, setLoadingComments] = useState<Set<string>>(
    new Set()
  );
  const [commentContent, setCommentContent] = useState<{
    [key: string]: string;
  }>({});
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMemeRef = useRef<HTMLDivElement | null>(null);
  const secondLastMemeRef = useRef<HTMLDivElement | null>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      return await getUserById(token, jwtDecode<{ id: string }>(token).id);
    },
  });

  const loadMemes = async (page: number) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const pageData = await getMemes(token, page);
      const memesWithAuthors = await Promise.all(
        pageData.results.map(async (meme) => {
          const author = await getUserById(token, meme.authorId);
          return { ...meme, author };
        })
      );

      setMemes((prev) => {
        const existingIds = new Set(prev.map((meme) => meme.id));
        const uniqueMemes = memesWithAuthors.filter(
          (meme) => !existingIds.has(meme.id)
        );
        return [...prev, ...uniqueMemes];
      });

      setHasMore(page < Math.ceil(pageData.total / pageData.pageSize));
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  const loadComments = async (memeId: string) => {
    setLoadingComments((prev) => new Set(prev).add(memeId));

    const firstPage = await getMemeComments(token, memeId, 1);
    const comments = [...firstPage.results];
    const remainingPages = Math.ceil(firstPage.total / firstPage.pageSize) - 1;

    for (let i = 0; i < remainingPages; i++) {
      const page = await getMemeComments(token, memeId, i + 2);
      comments.push(...page.results);
    }

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await getUserById(token, comment.authorId);
        return { ...comment, memeId, author };
      })
    );

    setMemes((prev) =>
      prev.map((meme) =>
        meme.id === memeId ? { ...meme, comments: commentsWithAuthors } : meme
      )
    );

    setLoadingComments((prev) => {
      const updated = new Set(prev);
      updated.delete(memeId);
      return updated;
    });
  };

  useEffect(() => {
    loadMemes(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !isLoading) {
            setCurrentPage((prev) => {
              if (!hasMore || isLoading) return prev;
              return prev + 1;
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (lastMemeRef.current) {
      observer.current.observe(lastMemeRef.current);
    }

    if (secondLastMemeRef.current) {
      observer.current.observe(secondLastMemeRef.current);
    }

    return () => observer.current?.disconnect();
  }, [hasMore, isLoading]);

  const { mutate } = useMutation({
    mutationFn: async (data: { memeId: string; content: string }) => {
      await createMemeComment(token, data.memeId, data.content);
    },
  });

  if (isLoading && memes.length === 0) {
    return <Loader data-testid="meme-feed-loader" />;
  }

  return (
    <Flex width="full" height="full" justifyContent="center" overflowY="auto">
      <VStack
        p={4}
        width="full"
        maxWidth={800}
        divider={<StackDivider border="gray.200" />}
      >
        {memes.map((meme, index) => {
          const isLastMeme = index === memes.length - 1;
          const isSecondLastMeme = index === memes.length - 2;

          return (
            <VStack
              key={meme.id}
              p={4}
              width="full"
              align="stretch"
              ref={
                isLastMeme
                  ? lastMemeRef
                  : isSecondLastMeme
                    ? secondLastMemeRef
                    : null
              }
            >
              <Flex justifyContent="space-between" alignItems="center">
                <Flex>
                  <Avatar
                    borderWidth="1px"
                    borderColor="gray.300"
                    size="xs"
                    name={meme.author.username}
                    src={meme.author.pictureUrl}
                  />
                  <Text ml={2} data-testid={`meme-author-${meme.id}`}>
                    {meme.author.username}
                  </Text>
                </Flex>
                <Text fontStyle="italic" color="gray.500" fontSize="small">
                  {format(meme.createdAt)}
                </Text>
              </Flex>
              <MemePicture
                pictureUrl={meme.pictureUrl}
                texts={meme.texts}
                dataTestId={`meme-picture-${meme.id}`}
              />
              <Box>
                <Text fontWeight="bold" fontSize="medium" mb={2}>
                  Description:{" "}
                </Text>
                <Box
                  p={2}
                  borderRadius={8}
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Text
                    color="gray.500"
                    whiteSpace="pre-line"
                    data-testid={`meme-description-${meme.id}`}
                  >
                    {meme.description}
                  </Text>
                </Box>
              </Box>
              <LinkBox as={Box} py={2} borderBottom="1px solid black">
                <Flex justifyContent="space-between" alignItems="center">
                  <Flex alignItems="center">
                    <LinkOverlay
                      data-testid={`meme-comments-section-${meme.id}`}
                      cursor="pointer"
                      onClick={() => {
                        if (openedCommentSection === meme.id) {
                          setOpenedCommentSection(null);
                        } else {
                          setOpenedCommentSection(meme.id);
                          if (!meme.comments) {
                            loadComments(meme.id);
                          }
                        }
                      }}
                    >
                      <Text data-testid={`meme-comments-count-${meme.id}`}>
                        {meme.comments?.length || meme.commentsCount || 0}{" "}
                        comments
                      </Text>
                    </LinkOverlay>
                    <Icon
                      as={
                        openedCommentSection !== meme.id ? CaretDown : CaretUp
                      }
                      ml={2}
                      mt={1}
                    />
                  </Flex>
                  <Icon as={Chat} />
                </Flex>
              </LinkBox>
              <Collapse in={openedCommentSection === meme.id} animateOpacity>
                <Box mb={6}>
                  {loadingComments.has(meme.id) ? (
                    <Loader data-testid={`meme-comments-loader-${meme.id}`} />
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!commentContent[meme.id]) {
                          return;
                        }
                        const newComment = {
                          id: `temp-${Date.now()}`,
                          authorId: user?.id || "",
                          memeId: meme.id,
                          content: commentContent[meme.id],
                          createdAt: new Date().toISOString(),
                          author: {
                            id: user?.id || "",
                            username: user?.username || "",
                            pictureUrl: user?.pictureUrl || "",
                          },
                        };

                        setMemes((prev) =>
                          prev.map((m) =>
                            m.id === meme.id
                              ? {
                                  ...m,
                                  comments: m.comments
                                    ? [newComment, ...m.comments]
                                    : [newComment],
                                }
                              : m
                          )
                        );

                        setCommentContent((prev) => ({
                          ...prev,
                          [meme.id]: "",
                        }));

                        mutate({
                          memeId: meme.id,
                          content: commentContent[meme.id],
                        });
                      }}
                    >
                      <Flex alignItems="center">
                        <Avatar
                          borderWidth="1px"
                          borderColor="gray.300"
                          name={user?.username}
                          src={user?.pictureUrl}
                          size="sm"
                          mr={2}
                        />
                        <Input
                          placeholder="Type your comment here..."
                          onChange={(event) => {
                            setCommentContent({
                              ...commentContent,
                              [meme.id]: event.target.value,
                            });
                          }}
                          value={commentContent[meme.id] || ""}
                        />
                      </Flex>
                    </form>
                  )}
                </Box>
                {!loadingComments.has(meme.id) && (
                  <VStack align="stretch" spacing={4}>
                    {meme.comments?.map((comment) => (
                      <Flex key={comment.id}>
                        <Avatar
                          borderWidth="1px"
                          borderColor="gray.300"
                          size="sm"
                          name={comment.author.username}
                          src={comment.author.pictureUrl}
                          mr={2}
                        />
                        <Box p={2} borderRadius={8} bg="gray.50" flexGrow={1}>
                          <Flex
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Flex>
                              <Text
                                data-testid={`meme-comment-author-${meme.id}-${comment.id}`}
                              >
                                {comment.author.username}
                              </Text>
                            </Flex>
                            <Text
                              fontStyle="italic"
                              color="gray.500"
                              fontSize="small"
                            >
                              {format(comment.createdAt)}
                            </Text>
                          </Flex>
                          <Text
                            color="gray.500"
                            whiteSpace="pre-line"
                            data-testid={`meme-comment-content-${meme.id}-${comment.id}`}
                          >
                            {comment.content}
                          </Text>
                        </Box>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </Collapse>
            </VStack>
          );
        })}
        {isLoading && <Loader />}
      </VStack>
    </Flex>
  );
};

export const Route = createFileRoute("/_authentication/")({
  component: MemeFeedPage,
});

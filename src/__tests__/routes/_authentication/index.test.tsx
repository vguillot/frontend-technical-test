import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";

import { AuthenticationContext } from "../../../contexts/authentication";
import { MemeFeedPage } from "../../../routes/_authentication/index";
import { mockToken } from "../../../../tests/mocks/token";
import { renderWithRouter } from "../../utils";

const MockIntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn(),
}));
vi.stubGlobal(`IntersectionObserver`, MockIntersectionObserver);

describe("routes/_authentication/index", () => {
  describe("MemeFeedPage", () => {
    function renderMemeFeedPage() {
      return renderWithRouter({
        component: MemeFeedPage,
        Wrapper: ({ children }) => (
          <ChakraProvider>
            <QueryClientProvider client={new QueryClient()}>
              <AuthenticationContext.Provider
                value={{
                  state: {
                    isAuthenticated: true,
                    userId: "dummy_user_id",
                    token: mockToken,
                  },
                  authenticate: () => {},
                  signout: () => {},
                }}
              >
                {children}
              </AuthenticationContext.Provider>
            </QueryClientProvider>
          </ChakraProvider>
        ),
      });
    }

    it("should fetch the memes and display them with their comments", async () => {
      renderMemeFeedPage();

      await waitFor(() => {
        // We check that the right author's username is displayed
        expect(
          screen.getByTestId("meme-author-dummy_meme_id_1")
        ).toHaveTextContent("dummy_user_1");

        // We check that the right meme's picture is displayed
        expect(screen.getByTestId("meme-picture-dummy_meme_id_1")).toHaveStyle({
          "background-image": 'url("https://dummy.url/meme/1")',
        });

        // We check that the right texts are displayed at the right positions
        const text1 = screen.getByTestId("meme-picture-dummy_meme_id_1-text-0");
        const text2 = screen.getByTestId("meme-picture-dummy_meme_id_1-text-1");
        expect(text1).toHaveTextContent("dummy text 1");
        expect(text1).toHaveStyle({
          top: "0px",
          left: "0px",
        });
        expect(text2).toHaveTextContent("dummy text 2");
        expect(text2).toHaveStyle({
          top: "100px",
          left: "100px",
        });

        // We check that the right description is displayed
        expect(
          screen.getByTestId("meme-description-dummy_meme_id_1")
        ).toHaveTextContent("dummy meme 1");

        // We check that the right number of comments is displayed
        expect(
          screen.getByTestId("meme-comments-count-dummy_meme_id_1")
        ).toHaveTextContent("3 comments");
      });

      // We check that the right comments with the right authors are displayed
      const commentsDropdown = screen.getByTestId(
        "meme-comments-section-dummy_meme_id_1"
      );
      fireEvent.click(commentsDropdown);
      await waitFor(() => {
        expect(
          screen.getByTestId(
            "meme-comment-content-dummy_meme_id_1-dummy_comment_id_1"
          )
        ).toHaveTextContent("dummy comment 1");
        expect(
          screen.getByTestId(
            "meme-comment-author-dummy_meme_id_1-dummy_comment_id_1"
          )
        ).toHaveTextContent("dummy_user_1");

        expect(
          screen.getByTestId(
            "meme-comment-content-dummy_meme_id_1-dummy_comment_id_2"
          )
        ).toHaveTextContent("dummy comment 2");
        expect(
          screen.getByTestId(
            "meme-comment-author-dummy_meme_id_1-dummy_comment_id_2"
          )
        ).toHaveTextContent("dummy_user_2");

        expect(
          screen.getByTestId(
            "meme-comment-content-dummy_meme_id_1-dummy_comment_id_3"
          )
        ).toHaveTextContent("dummy comment 3");
        expect(
          screen.getByTestId(
            "meme-comment-author-dummy_meme_id_1-dummy_comment_id_3"
          )
        ).toHaveTextContent("dummy_user_3");
      });
    });

    it("should add a comment locally, clear the input, and update the comment count", async () => {
      renderMemeFeedPage();

      // Mock data for the meme
      const memeId = "dummy_meme_id_1";
      const commentContent = "This is a new comment";

      // Wait for the memes to load
      await waitFor(() => {
        expect(
          screen.getByTestId(`meme-comments-count-${memeId}`)
        ).toHaveTextContent("3 comments");
      });

      const commentsDropdown = screen.getByTestId(
        "meme-comments-section-dummy_meme_id_1"
      );
      fireEvent.click(commentsDropdown);
      await waitFor(() => {
        // Find the input for the comment
        const commentInput = screen.getByPlaceholderText(
          "Type your comment here..."
        );
        fireEvent.change(commentInput, { target: { value: commentContent } });

        // Submit the comment
        const form = commentInput.closest("form")!;
        fireEvent.submit(form);

        // Check that the input is cleared
        expect(commentInput).toHaveValue("");
      });

      // Check that the comment is added locally
      await waitFor(() => {
        const commentElement = screen.getByTestId(
          new RegExp(`^meme-comment-content-${memeId}-temp-\\d+$`)
        );
        expect(commentElement).toHaveTextContent(commentContent);
      });

      // Check that the comment count is updated
      expect(
        screen.getByTestId(`meme-comments-count-${memeId}`)
      ).toHaveTextContent("4 comments");
    });
  });
});

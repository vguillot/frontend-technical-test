import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Plus, Trash } from "@phosphor-icons/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";

import { createMeme } from "../../api";
import { MemeEditor } from "../../components/meme-editor";
import {
  MemePictureProps,
  REF_HEIGHT,
  REF_WIDTH,
} from "../../components/meme-picture";
import { useAuthToken } from "../../contexts/authentication";

export const Route = createFileRoute("/_authentication/create")({
  component: CreateMemePage,
});

type Picture = {
  url: string;
  file: File;
};

function CreateMemePage() {
  const token = useAuthToken();
  const [picture, setPicture] = useState<Picture | null>(null);
  const [texts, setTexts] = useState<MemePictureProps["texts"]>([]);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const dimensions = useMemo(() => {
    if (!containerRef.current) {
      return { width: REF_WIDTH, height: REF_HEIGHT };
    }
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = (containerWidth / REF_WIDTH) * REF_HEIGHT;
    return { width: containerWidth, height: containerHeight };
  }, [containerRef.current]);

  const pictureWidth = dimensions.width;
  const pictureHeight = dimensions.height;

  const handleDrop = (file: File) => {
    setPicture({
      url: URL.createObjectURL(file),
      file,
    });
  };

  const handleAddCaptionButtonClick = () => {
    setTexts([
      ...texts,
      {
        content: `New caption ${texts.length + 1}`,
        x: Math.random() * 400,
        y: Math.random() * 225,
      },
    ]);
  };

  const handleDeleteCaptionButtonClick = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index));
  };

  const handleTextPositionChange = (index: number, x: number, y: number) => {
    setTexts((prevTexts) =>
      prevTexts.map((text, i) =>
        i === index
          ? {
              ...text,
              x,
              y,
            }
          : text
      )
    );
  };

  const memePicture = useMemo(() => {
    if (!picture) {
      return undefined;
    }

    return {
      pictureUrl: picture.url,
      texts,
      onTextPositionChange: handleTextPositionChange,
    };
  }, [picture, texts]);

  const isSubmitDisabled = useMemo(() => {
    return !picture || !description || texts.length === 0 || isSubmitting;
  }, [picture, description, texts, isSubmitting]);

  const handleSubmit = async () => {
    if (!picture || !description || texts.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createMeme(token, picture.file, description, texts);
      toast({
        title: "Meme created successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate({ to: "/" });
    } catch (error) {
      toast({
        title: "Failed to create meme",
        description:
          error instanceof Error ? error.message : "An error occurred",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Flex width="full" height="full">
      <Box flexGrow={1} height="full" p={4} overflowY="auto">
        <VStack spacing={5} align="stretch">
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Upload your picture
            </Heading>
            <MemeEditor onDrop={handleDrop} memePicture={memePicture} />
          </Box>
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Describe your meme
            </Heading>
            <Textarea
              placeholder="Type your description here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Box>
        </VStack>
      </Box>
      <Flex
        flexDir="column"
        width="30%"
        minW="250"
        height="full"
        boxShadow="lg"
      >
        <Heading as="h2" size="md" mb={2} p={4}>
          Add your captions
        </Heading>
        <Box p={4} flexGrow={1} height={0} overflowY="auto">
          <VStack>
            {texts.map((text, index) => (
              <Flex width="full" key={`caption-${index}`}>
                <Input
                  value={text.content}
                  onChange={(e) =>
                    setTexts(
                      texts.map((t, i) =>
                        i === index ? { ...t, content: e.target.value } : t
                      )
                    )
                  }
                  mr={1}
                />
                <IconButton
                  onClick={() => handleDeleteCaptionButtonClick(index)}
                  aria-label="Delete caption"
                  icon={<Icon as={Trash} />}
                />
              </Flex>
            ))}
            <Button
              colorScheme="cyan"
              leftIcon={<Icon as={Plus} />}
              variant="ghost"
              size="sm"
              width="full"
              onClick={handleAddCaptionButtonClick}
              isDisabled={memePicture === undefined}
            >
              Add a caption
            </Button>
          </VStack>
        </Box>
        <HStack p={4}>
          <Button
            as={Link}
            to="/"
            colorScheme="cyan"
            variant="outline"
            size="sm"
            width="full"
          >
            Cancel
          </Button>
          <Button
            colorScheme="cyan"
            size="sm"
            width="full"
            color="white"
            isDisabled={isSubmitDisabled}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
}

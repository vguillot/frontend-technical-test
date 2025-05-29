import { AspectRatio, Box, Button, Flex, Icon, Text } from "@chakra-ui/react";
import { Image, Pencil } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

import { MemePicture, MemePictureProps } from "./meme-picture";

export type MemeEditorProps = {
  onDrop: (file: File) => void;
  memePicture?: MemePictureProps;
};

function renderNoPicture() {
  return (
    <Flex
      flexDir="column"
      width="full"
      height="full"
      alignItems="center"
      justifyContent="center"
    >
      <Icon as={Image} color="black" boxSize={16} />
      <Text>Select a picture</Text>
      <Text color="gray.400" fontSize="sm">
        or drop it in this area
      </Text>
    </Flex>
  );
}

export const MemeEditor: React.FC<MemeEditorProps> = ({
  onDrop,
  memePicture,
}) => {
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: (files: File[]) => {
      if (files.length === 0) {
        return;
      }
      onDrop(files[0]);
    },
    noClick: memePicture !== undefined,
    accept: { "image/png": [".png"], "image/jpg": [".jpg", ".jpeg"] },
  });

  const [isDragging, setIsDragging] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (!isDragging) {
      timeoutRef.current = setTimeout(() => setShowButton(true), 1000); // Délai de 1 seconde pour permettre de grab une caption derrière
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowButton(false);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setShowButton(false);
  };

  const handleDragStop = () => {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
    setTimeout(() => setShowButton(true), 1000);
  };

  function renderMemePicture(memePicture: MemePictureProps, open: () => void) {
    return (
      <Box
        width="full"
        height="full"
        position="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        __css={{
          "&:hover .change-picture-button": {
            display: showButton ? "inline-block" : "none",
          },
          "& .change-picture-button": {
            display: "none",
          },
        }}
      >
        <MemePicture
          {...memePicture}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
        />
        <Button
          className="change-picture-button"
          leftIcon={<Icon as={Pencil} boxSize={4} />}
          colorScheme="cyan"
          color="white"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          position="absolute"
          onClick={open}
        >
          Change picture
        </Button>
      </Box>
    );
  }

  return (
    <AspectRatio ratio={16 / 9}>
      <Box
        {...getRootProps()}
        width="full"
        position="relative"
        border={memePicture ? undefined : "1px dashed"}
        borderColor="gray.300"
        borderRadius={9}
        px={1}
      >
        <input {...getInputProps()} />
        {memePicture ? renderMemePicture(memePicture, open) : renderNoPicture()}
      </Box>
    </AspectRatio>
  );
};

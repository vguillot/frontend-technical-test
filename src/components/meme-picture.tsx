import { Box, Text, useDimensions } from '@chakra-ui/react';
import { useMemo, useRef, useState } from 'react';

export type MemePictureProps = {
  pictureUrl: string;
  texts: {
    content: string;
    x: number;
    y: number;
  }[];
  dataTestId?: string;
  onTextPositionChange?: (index: number, x: number, y: number) => void;
  onDragStart?: () => void;
  onDragStop?: () => void;
};

export const REF_WIDTH = 800;
export const REF_HEIGHT = 450;
const REF_FONT_SIZE = 36;

export const MemePicture: React.FC<MemePictureProps> = ({
  pictureUrl,
  texts: rawTexts,
  dataTestId = "",
  onTextPositionChange,
  onDragStart,
  onDragStop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef, true);
  const boxWidth = dimensions?.borderBox.width;

  const { height, fontSize, texts } = useMemo(() => {
    if (!boxWidth) {
      return { height: 0, fontSize: 0, texts: rawTexts };
    }

    return {
      height: (boxWidth / REF_WIDTH) * REF_HEIGHT,
      fontSize: (boxWidth / REF_WIDTH) * REF_FONT_SIZE,
      texts: rawTexts.map((text) => ({
        ...text,
        x: (boxWidth / REF_WIDTH) * text.x,
        y: (boxWidth / REF_WIDTH) * text.y,
      })),
    };
  }, [boxWidth, rawTexts]);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [initialMousePosition, setInitialMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [initialTextPosition, setInitialTextPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingIndex(index);
    onDragStart?.();

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) {
      return;
    }
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    setInitialMousePosition({ x: mouseX, y: mouseY });
    setInitialTextPosition({
      x: texts[index].x,
      y: texts[index].y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      draggingIndex === null ||
      !containerRef.current ||
      !initialMousePosition ||
      !initialTextPosition
    )
      return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const deltaX = mouseX - initialMousePosition.x;
    const deltaY = mouseY - initialMousePosition.y;

    const scaleX = REF_WIDTH / containerRect.width;
    const scaleY = REF_HEIGHT / containerRect.height;

    const newX = Math.round(
      Math.max(
        0,
        Math.min(initialTextPosition.x + deltaX * scaleX, REF_WIDTH - fontSize)
      )
    );
    const newY = Math.round(
      Math.max(
        0,
        Math.min(initialTextPosition.y + deltaY * scaleY, REF_HEIGHT - fontSize)
      )
    );

    if (onTextPositionChange) {
      onTextPositionChange(draggingIndex, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
    onDragStop?.();
    setInitialMousePosition(null);
    setInitialTextPosition(null);
  };

  const handleMouseLeave = () => {
    handleMouseUp();
  };

  return (
    <Box
      width="full"
      height={height}
      ref={containerRef}
      backgroundImage={pictureUrl}
      backgroundColor="gray.100"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      backgroundSize="contain"
      overflow="hidden"
      position="relative"
      borderRadius={8}
      data-testid={dataTestId}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {texts.map((text, index) => (
        <Text
          key={index}
          position="absolute"
          left={text.x}
          top={text.y}
          fontSize={fontSize}
          color="white"
          fontFamily="Impact"
          fontWeight="bold"
          userSelect="none"
          textTransform="uppercase"
          style={{ WebkitTextStroke: "1px black" }}
          data-testid={`${dataTestId}-text-${index}`}
          onMouseDown={handleMouseDown(index)}
        >
          {text.content}
        </Text>
      ))}
    </Box>
  );
};

"use client";

import { ReactNode } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { EmojiClickData } from "emoji-picker-react";

interface IEmojiPickerProps {
  children: ReactNode;
  getValue?: (emoji: string) => void;
}

const EmojiPicker = ({
  children,
  getValue = () => null,
}: IEmojiPickerProps) => {
  //   const route = useRouter();
  const Picker = dynamic(() => import("emoji-picker-react"));
  const handleOnClick = (selectedEmoji: EmojiClickData) => {
    if (getValue) getValue(selectedEmoji.emoji);
  };
  return (
    <div className="flex items-center">
      <Popover>
        <PopoverTrigger className="cursor-pointer">{children}</PopoverTrigger>
        <PopoverContent className="p-0 border-none">
          <Picker onEmojiClick={handleOnClick} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EmojiPicker;

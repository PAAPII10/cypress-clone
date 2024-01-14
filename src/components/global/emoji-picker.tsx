"use client";

import { ReactNode, useState } from "react";
import dynamic from "next/dynamic";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { EmojiClickData } from "emoji-picker-react";

const Picker = dynamic(() => import("emoji-picker-react"));

interface IEmojiPickerProps {
  children: ReactNode;
  getValue?: (emoji: string) => void;
}

const EmojiPicker = ({
  children,
  getValue = () => null,
}: IEmojiPickerProps) => {
  //   const route = useRouter();
  const [openPicker, setOpenPicker] = useState(false);
  const handleOnClick = (selectedEmoji: EmojiClickData) => {
    if (getValue) getValue(selectedEmoji.emoji);
    setOpenPicker(false);
  };

  return (
    <div className="flex items-center">
      <Popover open={openPicker} onOpenChange={(open) => setOpenPicker(open)}>
        <PopoverTrigger className="cursor-pointer">{children}</PopoverTrigger>
        <PopoverContent className="p-0 border-none">
          <Picker onEmojiClick={handleOnClick} />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EmojiPicker;

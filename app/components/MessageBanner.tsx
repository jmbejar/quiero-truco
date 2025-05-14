import React from 'react';

interface MessageBannerProps {
  message: string;
}

const MessageBanner: React.FC<MessageBannerProps> = ({ message }) => (
  <div className="text-lg font-semibold text-gray-800 mb-4 text-center min-h-[48px]">{message}</div>
);

export default MessageBanner; 
import { CreateChatDto } from './create-chat.dto.js';
declare const UpdateChatDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateChatDto>>;
export declare class UpdateChatDto extends UpdateChatDto_base {
    id: number;
}
export {};

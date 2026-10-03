import { PartialType } from '@nestjs/mapped-types';
import { CreateChatDto } from './create-chat.dto.js';
export class UpdateChatDto extends PartialType(CreateChatDto) {
    id;
}
//# sourceMappingURL=update-chat.dto.js.map
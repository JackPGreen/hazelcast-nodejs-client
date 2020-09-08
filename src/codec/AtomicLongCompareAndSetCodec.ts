/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable max-len */
import {BitsUtil} from '../util/BitsUtil';
import {FixSizedTypesCodec} from './builtin/FixSizedTypesCodec';
import {ClientMessage, Frame, RESPONSE_BACKUP_ACKS_OFFSET, PARTITION_ID_OFFSET} from '../protocol/ClientMessage';
import * as Long from 'long';
import {RaftGroupId} from '../proxy/cpsubsystem/RaftGroupId';
import {RaftGroupIdCodec} from './custom/RaftGroupIdCodec';
import {StringCodec} from './builtin/StringCodec';

// hex: 0x090400
const REQUEST_MESSAGE_TYPE = 590848;
// hex: 0x090401
// RESPONSE_MESSAGE_TYPE = 590849

const REQUEST_EXPECTED_OFFSET = PARTITION_ID_OFFSET + BitsUtil.INT_SIZE_IN_BYTES;
const REQUEST_UPDATED_OFFSET = REQUEST_EXPECTED_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const REQUEST_INITIAL_FRAME_SIZE = REQUEST_UPDATED_OFFSET + BitsUtil.LONG_SIZE_IN_BYTES;
const RESPONSE_RESPONSE_OFFSET = RESPONSE_BACKUP_ACKS_OFFSET + BitsUtil.BYTE_SIZE_IN_BYTES;

/** @internal */
export interface AtomicLongCompareAndSetResponseParams {
    response: boolean;
}

/** @internal */
export class AtomicLongCompareAndSetCodec {
    static encodeRequest(groupId: RaftGroupId, name: string, expected: Long, updated: Long): ClientMessage {
        const clientMessage = ClientMessage.createForEncode();
        clientMessage.setRetryable(false);

        const initialFrame = Frame.createInitialFrame(REQUEST_INITIAL_FRAME_SIZE);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_EXPECTED_OFFSET, expected);
        FixSizedTypesCodec.encodeLong(initialFrame.content, REQUEST_UPDATED_OFFSET, updated);
        clientMessage.addFrame(initialFrame);
        clientMessage.setMessageType(REQUEST_MESSAGE_TYPE);
        clientMessage.setPartitionId(-1);

        RaftGroupIdCodec.encode(clientMessage, groupId);
        StringCodec.encode(clientMessage, name);
        return clientMessage;
    }

    static decodeResponse(clientMessage: ClientMessage): AtomicLongCompareAndSetResponseParams {
        const initialFrame = clientMessage.nextFrame();

        const response = {} as AtomicLongCompareAndSetResponseParams;
        response.response = FixSizedTypesCodec.decodeBoolean(initialFrame.content, RESPONSE_RESPONSE_OFFSET);

        return response;
    }
}
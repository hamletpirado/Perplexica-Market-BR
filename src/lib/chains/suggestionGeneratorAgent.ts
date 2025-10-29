import { RunnableSequence, RunnableMap } from '@langchain/core/runnables';
import ListLineOutputParser from '../outputParsers/listLineOutputParser';
import { PromptTemplate } from '@langchain/core/prompts';
import formatChatHistoryAsString from '../utils/formatHistory';
import { BaseMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';

const suggestionGeneratorPrompt = `
Você é um gerador de sugestões de IA para um mecanismo de busca com IA. Você receberá uma conversa abaixo. Você precisa gerar 4-5 sugestões baseadas na conversa. As sugestões devem ser relevantes à conversa e podem ser usadas pelo usuário para perguntar ao modelo de chat por mais informações.

Certifique-se de que as sugestões sejam relevantes à conversa e úteis ao usuário. Observe que o usuário pode usar essas sugestões para pedir mais informações ao modelo de chat.
Certifique-se de que as sugestões tenham tamanho médio e sejam informativas e relevantes à conversa.

Todas as sugestões DEVEM estar em português brasileiro.

Forneça essas sugestões separadas por quebras de linha entre as tags XML <suggestions> e </suggestions>. Por exemplo:

<suggestions>
Me conte mais sobre a SpaceX e seus projetos recentes
Quais são as últimas notícias sobre a SpaceX?
Quem é o CEO da SpaceX?
</suggestions>

Conversa:
{chat_history}
`;

type SuggestionGeneratorInput = {
  chat_history: BaseMessage[];
};

const outputParser = new ListLineOutputParser({
  key: 'suggestions',
});

const createSuggestionGeneratorChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: SuggestionGeneratorInput) =>
        formatChatHistoryAsString(input.chat_history),
    }),
    PromptTemplate.fromTemplate(suggestionGeneratorPrompt),
    llm,
    outputParser,
  ]);
};

const generateSuggestions = (
  input: SuggestionGeneratorInput,
  llm: BaseChatModel,
) => {
  (llm as unknown as ChatOpenAI).temperature = 0;
  const suggestionGeneratorChain = createSuggestionGeneratorChain(llm);
  return suggestionGeneratorChain.invoke(input);
};

export default generateSuggestions;

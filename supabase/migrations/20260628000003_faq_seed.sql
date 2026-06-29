-- ─── FAQ Seed — SuaAgenda.Pro ────────────────────────────────────────────────
-- Conteúdo inicial para automação WhatsApp / atendimento IA a profissionais
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  cat_inicio        UUID;
  cat_agenda        UUID;
  cat_planos        UUID;
  cat_whatsapp      UUID;
  cat_clientes      UUID;
  cat_servicos      UUID;
  cat_config        UUID;
  cat_pagina        UUID;
  cat_dashboard     UUID;
  cat_problemas     UUID;

  sub_conta         UUID;
  sub_horarios      UUID;
  sub_bloqueios     UUID;
  sub_pix           UUID;
  sub_mp            UUID;
  sub_assinatura    UUID;
  sub_notif         UUID;
  sub_integ         UUID;
  sub_perfil        UUID;
  sub_tema          UUID;
  sub_social        UUID;
  sub_hist          UUID;
  sub_tecnico       UUID;
BEGIN

-- ─── CATEGORIAS ──────────────────────────────────────────────────────────────

INSERT INTO faq_categories (name, slug, description, icon, sort_order) VALUES
  ('Primeiros Passos',          'primeiros-passos',   'Como começar a usar o SuaAgenda.Pro',              '🚀', 10),
  ('Agendamentos',              'agendamentos',       'Como funciona a agenda e os agendamentos',         '📅', 20),
  ('Planos e Pagamentos',       'planos-pagamentos',  'Planos, preços, cobranças e faturamento',          '💳', 30),
  ('WhatsApp e Notificações',   'whatsapp-notif',     'Automação WhatsApp, lembretes e mensagens',        '💬', 40),
  ('Clientes',                  'clientes',           'Cadastro e gestão de clientes',                    '👥', 50),
  ('Serviços',                  'servicos',           'Cadastro e configuração de serviços',              '✂️', 60),
  ('Configurações',             'configuracoes',      'Perfil, página pública e personalizações',         '⚙️', 70),
  ('Página Pública',            'pagina-publica',     'Seu link de agendamento e como compartilhar',      '🌐', 80),
  ('Dashboard e Relatórios',    'dashboard',          'Métricas, faturamento e desempenho',               '📊', 90),
  ('Problemas e Suporte',       'problemas-suporte',  'Erros comuns, dúvidas técnicas e suporte',        '🔧',100)
RETURNING id INTO cat_inicio;

-- Captura IDs por slug (forma segura)
SELECT id INTO cat_inicio     FROM faq_categories WHERE slug = 'primeiros-passos';
SELECT id INTO cat_agenda     FROM faq_categories WHERE slug = 'agendamentos';
SELECT id INTO cat_planos     FROM faq_categories WHERE slug = 'planos-pagamentos';
SELECT id INTO cat_whatsapp   FROM faq_categories WHERE slug = 'whatsapp-notif';
SELECT id INTO cat_clientes   FROM faq_categories WHERE slug = 'clientes';
SELECT id INTO cat_servicos   FROM faq_categories WHERE slug = 'servicos';
SELECT id INTO cat_config     FROM faq_categories WHERE slug = 'configuracoes';
SELECT id INTO cat_pagina     FROM faq_categories WHERE slug = 'pagina-publica';
SELECT id INTO cat_dashboard  FROM faq_categories WHERE slug = 'dashboard';
SELECT id INTO cat_problemas  FROM faq_categories WHERE slug = 'problemas-suporte';

-- ─── SUBCATEGORIAS ───────────────────────────────────────────────────────────

INSERT INTO faq_subcategories (category_id, name, sort_order) VALUES
  (cat_inicio,   'Conta e Cadastro',          10),
  (cat_agenda,   'Horários de Funcionamento', 10),
  (cat_agenda,   'Bloqueios e Férias',        20),
  (cat_planos,   'PIX',                       10),
  (cat_planos,   'Mercado Pago',              20),
  (cat_planos,   'Assinatura do Plano',       30),
  (cat_whatsapp, 'Notificações',              10),
  (cat_whatsapp, 'Integrações',               20),
  (cat_config,   'Perfil Profissional',       10),
  (cat_config,   'Temas e Visual',            20),
  (cat_config,   'Redes Sociais',             30),
  (cat_clientes, 'Histórico',                 10),
  (cat_problemas,'Erros Técnicos',            10);

SELECT id INTO sub_conta     FROM faq_subcategories WHERE name = 'Conta e Cadastro';
SELECT id INTO sub_horarios  FROM faq_subcategories WHERE name = 'Horários de Funcionamento';
SELECT id INTO sub_bloqueios FROM faq_subcategories WHERE name = 'Bloqueios e Férias';
SELECT id INTO sub_pix       FROM faq_subcategories WHERE name = 'PIX';
SELECT id INTO sub_mp        FROM faq_subcategories WHERE name = 'Mercado Pago';
SELECT id INTO sub_assinatura FROM faq_subcategories WHERE name = 'Assinatura do Plano';
SELECT id INTO sub_notif     FROM faq_subcategories WHERE name = 'Notificações';
SELECT id INTO sub_integ     FROM faq_subcategories WHERE name = 'Integrações';
SELECT id INTO sub_perfil    FROM faq_subcategories WHERE name = 'Perfil Profissional';
SELECT id INTO sub_tema      FROM faq_subcategories WHERE name = 'Temas e Visual';
SELECT id INTO sub_social    FROM faq_subcategories WHERE name = 'Redes Sociais';
SELECT id INTO sub_hist      FROM faq_subcategories WHERE name = 'Histórico';
SELECT id INTO sub_tecnico   FROM faq_subcategories WHERE name = 'Erros Técnicos';

-- ─── FAQ ITEMS ────────────────────────────────────────────────────────────────
-- ── 1. PRIMEIROS PASSOS ───────────────────────────────────────────────────────

INSERT INTO faq_items (category_id, subcategory_id, question, answer, keywords, sort_order) VALUES

(cat_inicio, sub_conta, 'Como criar minha conta no SuaAgenda.Pro?',
'Acesse suaagenda.pro, clique em "Começar grátis" e preencha nome, e-mail e senha. Após confirmar o e-mail, você já pode configurar seu perfil e começar a usar. O cadastro é 100% online e leva menos de 2 minutos.',
ARRAY['cadastro','criar conta','registro','começar','acesso','entrar'],
10),

(cat_inicio, sub_conta, 'Qual é o período de teste gratuito?',
'O SuaAgenda.Pro oferece 7 dias de teste grátis com acesso completo a todas as funcionalidades do plano Pro. Não é necessário cartão de crédito para começar. Após o período de teste, você escolhe o plano que melhor se encaixa no seu negócio.',
ARRAY['teste','grátis','gratuito','trial','período','dias','free'],
20),

(cat_inicio, sub_conta, 'Como funciona o SuaAgenda.Pro?',
'O SuaAgenda.Pro é um sistema de agendamento online para profissionais autônomos e salões. Você cadastra seus serviços, define seus horários e compartilha um link personalizado com seus clientes. Os clientes acessam sua página, escolhem o serviço e horário, e o agendamento entra direto na sua agenda — sem precisar de troca de mensagens.',
ARRAY['como funciona','sistema','agendamento online','app','plataforma','ferramenta'],
30),

(cat_inicio, sub_conta, 'Esqueci minha senha. Como recuperar?',
'Na tela de login, clique em "Esqueci minha senha". Informe o e-mail cadastrado e você receberá um link de redefinição. Verifique também a caixa de spam caso não encontre o e-mail em poucos minutos.',
ARRAY['senha','esqueci','recuperar','redefinir','login','acesso','esqueceu'],
40),

(cat_inicio, sub_conta, 'Posso usar o SuaAgenda.Pro pelo celular?',
'Sim! O SuaAgenda.Pro é totalmente responsivo e funciona pelo navegador do celular. Você pode acessar sua agenda, confirmar agendamentos e gerenciar clientes direto pelo smartphone, sem precisar instalar nada.',
ARRAY['celular','mobile','smartphone','app','aplicativo','telefone'],
50),

(cat_inicio, sub_conta, 'Como configurar meu perfil profissional?',
'Acesse o menu "Perfil Profissional" no aplicativo. Lá você pode adicionar sua foto, descrição, especialidade, endereço, telefone para WhatsApp e links das redes sociais. Essas informações aparecem na sua página pública de agendamentos.',
ARRAY['perfil','configurar','foto','descrição','dados','endereço','informações'],
60),

-- ── 2. AGENDAMENTOS ───────────────────────────────────────────────────────────

(cat_agenda, sub_horarios, 'Como configurar meus horários de atendimento?',
'Vá em "Configurações" > "Horários". Selecione os dias da semana que você atende e defina o horário de início e fim para cada dia. Você também pode definir horários diferentes para cada dia da semana. Os horários cadastrados determinam quais slots aparecem disponíveis para seus clientes.',
ARRAY['horários','atendimento','funcionamento','dias','semana','configurar','expediente'],
10),

(cat_agenda, sub_horarios, 'Posso ter horários diferentes para cada dia da semana?',
'Sim. Na tela de horários, cada dia pode ter seu próprio horário de início e término. Por exemplo: segunda a sexta das 9h às 18h, e sábado das 9h às 13h. Também é possível marcar dias como fechados.',
ARRAY['horário diferente','dias','semana','individual','personalizado'],
20),

(cat_agenda, sub_bloqueios, 'Como bloquear horários na agenda?',
'Acesse a agenda e clique no período que deseja bloquear, ou use a opção "Bloquear horário" no menu. Você pode bloquear um horário específico ou dias inteiros (por exemplo, para compromissos pessoais ou reuniões). Durante o bloqueio, aquele slot não aparece disponível para os clientes.',
ARRAY['bloquear','bloqueio','indisponível','horário','ocupado','compromisso'],
10),

(cat_agenda, sub_bloqueios, 'Como registrar férias ou folga no sistema?',
'Na agenda, selecione os dias de folga ou férias e use a opção "Bloquear período". Você pode bloquear vários dias de uma vez. Os clientes não conseguirão agendar nesse período, e você pode adicionar um motivo interno para controle.',
ARRAY['férias','folga','feriado','ausência','período','bloquear','recesso'],
20),

(cat_agenda, NULL, 'Como os clientes agendam pelo meu link?',
'O cliente acessa seu link personalizado (ex: suaagenda.pro/agendar/seu-nome), vê seus serviços e horários disponíveis, escolhe o que deseja e preenche nome, WhatsApp e e-mail. O agendamento é confirmado na hora e aparece direto na sua agenda.',
ARRAY['cliente','agendar','link','como funciona','página','reservar'],
30),

(cat_agenda, NULL, 'O cliente precisa criar conta para agendar?',
'Não! Seus clientes não precisam criar conta nem instalar nada. Basta acessar seu link, escolher o serviço e o horário, e preencher os dados básicos (nome e WhatsApp). O processo é rápido e simples.',
ARRAY['cliente','conta','cadastro','sem conta','facilidade'],
40),

(cat_agenda, NULL, 'Como confirmar ou cancelar um agendamento?',
'Na sua agenda, clique sobre o agendamento para ver os detalhes. Você pode marcar como confirmado, cancelar ou reagendar. Em caso de cancelamento, o cliente pode receber uma notificação automática via WhatsApp, caso a integração esteja ativa.',
ARRAY['confirmar','cancelar','agendamento','reagendar','status'],
50),

(cat_agenda, NULL, 'Posso adicionar manualmente um agendamento para um cliente?',
'Sim! Na agenda, clique no horário desejado e selecione "Novo agendamento manual". Preencha os dados do cliente, escolha o serviço e confirme. Isso é útil para clientes que ligam ou chegam pessoalmente.',
ARRAY['manual','adicionar','agendamento','registrar','criar','calendário'],
60),

(cat_agenda, NULL, 'Como ver os agendamentos do dia ou da semana?',
'Na tela de Agenda, você pode alternar entre as visões de dia, semana e mês. Todos os agendamentos aparecem com cor por status (confirmado, pendente, cancelado) para facilitar a visualização.',
ARRAY['ver','agendamentos','dia','semana','agenda','calendário','visualizar'],
70),

(cat_agenda, NULL, 'O sistema envia confirmação automática para o cliente?',
'Sim! Ao confirmar o agendamento, o sistema dispara automaticamente uma mensagem de confirmação para o WhatsApp e e-mail do cliente, com os detalhes do serviço, data e horário. Para isso, a integração com WhatsApp precisa estar ativa nas configurações.',
ARRAY['confirmação','automático','mensagem','cliente','notificação','whatsapp'],
80),

(cat_agenda, NULL, 'Posso receber agendamento de última hora?',
'Sim. Você pode configurar se aceita agendamentos com antecedência mínima — por exemplo, somente com 1 hora de antecedência ou mais. Se quiser, também pode deixar aberto para qualquer horário disponível naquele dia.',
ARRAY['última hora','antecedência','mesmo dia','urgente','prazo'],
90),

-- ── 3. PLANOS E PAGAMENTOS ────────────────────────────────────────────────────

(cat_planos, sub_assinatura, 'Quais são os planos disponíveis?',
'O SuaAgenda.Pro oferece dois planos pagos após o período de teste:
• Plano Básico: ideal para quem está começando, com agendamento online, página pública e gestão de clientes.
• Plano Pro: inclui tudo do Básico + integração WhatsApp, relatórios avançados, portfólio e recebimento de sinal online.

Acesse "Plano" no menu para ver os valores atuais e comparar.',
ARRAY['planos','preço','valor','básico','pro','assinar','diferença','quanto custa'],
10),

(cat_planos, sub_assinatura, 'Quanto custa o SuaAgenda.Pro?',
'Os valores são exibidos em tempo real na página de planos dentro do aplicativo (Menu > Plano) e no site suaagenda.pro/precos. O plano Básico e o Pro têm cobrança mensal ou anual (com desconto). Durante o período de teste de 7 dias, o acesso é 100% gratuito.',
ARRAY['preço','valor','quanto','custa','mensalidade','cobrança','plano'],
20),

(cat_planos, sub_assinatura, 'Como é feita a cobrança do plano?',
'A cobrança é mensal, via boleto ou PIX, gerado automaticamente pela Asaas (nossa processadora financeira). Você recebe o boleto/PIX por e-mail antes do vencimento. No plano anual, a cobrança é feita uma vez por ano com desconto.',
ARRAY['cobrança','boleto','pix','mensalidade','pagar','fatura','vencimento'],
30),

(cat_planos, sub_assinatura, 'Posso cancelar meu plano a qualquer momento?',
'Sim, sem multa ou fidelidade. Acesse "Plano" no menu e clique em "Cancelar assinatura". Seu acesso continua até o fim do período pago. Seus dados ficam preservados por 30 dias após o cancelamento, caso queira reativar.',
ARRAY['cancelar','assinatura','plano','fidelidade','multa','sair','encerrar'],
40),

(cat_planos, sub_assinatura, 'O SuaAgenda cobra comissão sobre os meus serviços?',
'Não! O SuaAgenda.Pro cobra apenas a mensalidade do plano. Não há comissão sobre agendamentos, nem sobre os pagamentos que você recebe dos clientes. 100% do valor do serviço é seu.',
ARRAY['comissão','taxa','porcentagem','desconto','cobrar','serviço'],
50),

(cat_planos, sub_pix, 'Como configurar o recebimento de sinal via PIX?',
'Acesse "Configurações" > "Pagamentos" e insira sua chave PIX (CPF, CNPJ, e-mail, telefone ou chave aleatória). Defina o percentual do sinal (sugerimos 30%). Quando ativo, o cliente paga o sinal pelo QR Code na hora do agendamento, antes de confirmar.',
ARRAY['pix','sinal','chave','pagamento','receber','configurar','qr code'],
10),

(cat_planos, sub_pix, 'O cliente consegue pagar o sinal no momento do agendamento?',
'Sim! Após escolher o serviço e preencher os dados, o cliente vê um QR Code PIX para pagar o sinal (valor configurável, geralmente 30% do serviço). Após enviar o comprovante via WhatsApp, o agendamento é confirmado.',
ARRAY['sinal','pagar','pix','qr code','pagamento','agendamento','confirmar'],
20),

(cat_planos, sub_mp, 'Como integrar com o Mercado Pago?',
'Acesse "Configurações" > "Pagamentos" > "Mercado Pago" e clique em "Conectar". Você será redirecionado para o Mercado Pago para autorizar a integração com sua conta. Após conectar, o cliente pode pagar o sinal com cartão de crédito, débito ou PIX diretamente pelo Mercado Pago.',
ARRAY['mercado pago','integração','conectar','cartão','pagamento online','mp'],
10),

(cat_planos, sub_mp, 'Posso receber com cartão de crédito dos clientes?',
'Sim, através da integração com Mercado Pago. O cliente paga o sinal com cartão de crédito, débito ou PIX no próprio fluxo de agendamento, sem sair da página. O valor é depositado na sua conta Mercado Pago.',
ARRAY['cartão','crédito','débito','receber','pagamento','mercado pago'],
20),

-- ── 4. WHATSAPP E NOTIFICAÇÕES ───────────────────────────────────────────────

(cat_whatsapp, sub_notif, 'O sistema envia lembrete automático para os clientes?',
'Sim! O SuaAgenda.Pro envia automaticamente:
• Confirmação imediata após o agendamento
• Lembrete 24h antes do horário
• Lembrete 1h antes (configurável)
• Mensagem de cancelamento, se aplicável

Tudo via WhatsApp e/ou e-mail, dependendo das suas configurações.',
ARRAY['lembrete','automático','notificação','whatsapp','email','aviso','cliente'],
10),

(cat_whatsapp, sub_notif, 'Posso personalizar as mensagens enviadas aos clientes?',
'Sim! Acesse "Configurações" > "Mensagens" para editar os templates de cada tipo de notificação (confirmação, lembrete, cancelamento). Você pode usar variáveis como {nome_cliente}, {servico}, {data}, {horario} para personalizar o texto.',
ARRAY['personalizar','mensagem','template','texto','notificação','editar','variável'],
20),

(cat_whatsapp, sub_notif, 'Os clientes recebem notificação quando eu cancelo um agendamento?',
'Sim. Ao cancelar um agendamento pelo sistema, o cliente recebe automaticamente uma mensagem no WhatsApp informando o cancelamento. Você pode personalizar o texto dessa mensagem nas configurações de templates.',
ARRAY['cancelar','notificação','cliente','aviso','mensagem','whatsapp'],
30),

(cat_whatsapp, sub_integ, 'Como funciona a integração com WhatsApp?',
'O SuaAgenda.Pro usa a Evolution API para enviar mensagens pelo WhatsApp. Para ativar, acesse "Configurações" > "WhatsApp" e escaneie o QR Code com seu celular para conectar o número. Após conectado, todas as notificações automáticas passam a ser enviadas pelo seu próprio número.',
ARRAY['whatsapp','integração','evolution','qr code','conectar','número','api'],
10),

(cat_whatsapp, sub_integ, 'Preciso de um número de WhatsApp exclusivo para o sistema?',
'Não é obrigatório, mas é recomendado usar um número dedicado ao negócio (não o seu pessoal). O número fica vinculado ao sistema e as mensagens automáticas são enviadas por ele. Enquanto conectado, você não consegue usar esse número no WhatsApp Business ao mesmo tempo.',
ARRAY['número','whatsapp','exclusivo','dedicado','business','celular'],
20),

(cat_whatsapp, sub_integ, 'Como integrar com o Google Calendar?',
'Acesse "Configurações" > "Google Calendar" e clique em "Conectar com Google". Faça login na sua conta Google e autorize o acesso. Após conectar, todos os agendamentos do SuaAgenda.Pro aparecem automaticamente no seu Google Calendar.',
ARRAY['google calendar','calendário','google','integração','sincronizar','conectar'],
30),

(cat_whatsapp, sub_integ, 'O SuaAgenda.Pro funciona com N8N para automações?',
'Sim! O sistema tem uma API pública de busca no FAQ e endpoints para consulta de agendamentos, compatíveis com N8N, Make (Integromat) e qualquer ferramenta de automação. Com o N8N, você pode criar fluxos personalizados de mensagens, relatórios automáticos e muito mais.',
ARRAY['n8n','automação','make','integromat','api','webhook','fluxo'],
40),

-- ── 5. CLIENTES ──────────────────────────────────────────────────────────────

(cat_clientes, NULL, 'Os dados dos clientes ficam salvos no sistema?',
'Sim. Todo cliente que agenda pelo seu link tem seus dados (nome, WhatsApp, e-mail) salvos automaticamente no seu painel de "Clientes". Os dados ficam vinculados ao seu perfil e você pode consultá-los a qualquer momento.',
ARRAY['clientes','dados','salvar','cadastro','histórico','armazenar'],
10),

(cat_clientes, NULL, 'Como cadastrar um cliente manualmente?',
'Acesse "Clientes" no menu e clique em "Novo cliente". Preencha nome, telefone e e-mail. O cliente fica salvo e você pode associar agendamentos manuais a ele. Clientes que agendaram pelo link já são cadastrados automaticamente.',
ARRAY['cadastrar','cliente','manual','novo','adicionar','registrar'],
20),

(cat_clientes, sub_hist, 'Como ver o histórico de agendamentos de um cliente?',
'Na tela de "Clientes", clique sobre o nome do cliente para abrir o perfil. Lá você vê todos os agendamentos passados e futuros, valores gastos, serviços utilizados e avaliações deixadas.',
ARRAY['histórico','cliente','agendamentos','passados','ver','perfil'],
10),

(cat_clientes, sub_hist, 'Como adicionar notas internas sobre um cliente?',
'Dentro do perfil do cliente (Clientes > selecionar cliente), há um campo "Notas internas". Você pode registrar observações que só você vê, como preferências, alergias ou informações importantes para o atendimento.',
ARRAY['notas','observação','interna','cliente','registrar','anotar','alergias'],
20),

(cat_clientes, NULL, 'Como saber quais clientes não agendaram há muito tempo?',
'No painel de Clientes, você pode filtrar e ordenar pelos clientes com menor data de último agendamento. Isso ajuda a identificar clientes inativos para campanhas de reativação via WhatsApp.',
ARRAY['inativo','clientes','filtrar','tempo','último','reativação','campanha'],
30),

-- ── 6. SERVIÇOS ──────────────────────────────────────────────────────────────

(cat_servicos, NULL, 'Como cadastrar meus serviços?',
'Acesse "Serviços" no menu e clique em "Novo serviço". Informe o nome, descrição, duração (em minutos) e preço. Você pode também adicionar uma foto e escolher a categoria. O serviço fica disponível imediatamente na sua página pública.',
ARRAY['serviço','cadastrar','novo','preço','duração','criar','adicionar'],
10),

(cat_servicos, NULL, 'Posso ter serviços com durações diferentes?',
'Sim. Cada serviço tem sua própria duração configurável em minutos. Por exemplo: Corte (30 min), Coloração (90 min), Sobrancelha (15 min). O sistema bloqueia automaticamente os slots de acordo com a duração de cada serviço.',
ARRAY['duração','minutos','serviço','tempo','diferente','configurar'],
20),

(cat_servicos, NULL, 'Como ocultar um serviço temporariamente?',
'Na lista de serviços, clique nas três linhas ao lado do serviço e selecione "Desativar". O serviço fica oculto na página pública mas continua salvo no sistema. Para reativar, repita o processo e clique em "Ativar".',
ARRAY['ocultar','desativar','temporário','serviço','esconder','ativar','reativar'],
30),

(cat_servicos, NULL, 'Posso definir que um serviço não pode ser agendado online?',
'Sim. Na edição do serviço, há uma opção "Disponível para agendamento online". Desativando, o serviço aparece no portfólio mas o cliente não consegue agendar — ele precisará entrar em contato diretamente.',
ARRAY['online','agendamento','desativar','serviço','contato','somente presencial'],
40),

(cat_servicos, NULL, 'Como adicionar foto ao serviço?',
'Na tela de edição do serviço, há um campo para imagem. Clique em "Adicionar foto" e faça upload de uma imagem do serviço. Recomendamos usar fotos do resultado do trabalho para atrair mais clientes.',
ARRAY['foto','imagem','serviço','upload','adicionar','foto do trabalho'],
50),

-- ── 7. CONFIGURAÇÕES ─────────────────────────────────────────────────────────

(cat_config, sub_perfil, 'Como alterar meu link personalizado (slug)?',
'Acesse "Configurações" > "Página Pública" e edite o campo "Link personalizado". Escolha um nome fácil de lembrar (ex: seu nome ou nome do salão). O link ficará disponível em suaagenda.pro/agendar/seu-link. Atenção: ao alterar, o link antigo para de funcionar.',
ARRAY['link','slug','url','personalizado','alterar','mudar','endereço'],
10),

(cat_config, sub_perfil, 'Como adicionar minha logo ao perfil?',
'Acesse "Configurações" > "Página Pública". Role até "Logo do negócio" e clique em "Enviar logo". Faça upload de uma imagem PNG com fundo transparente para melhor resultado. A logo aparece no menu da sua página pública.',
ARRAY['logo','imagem','marca','upload','foto','perfil','negócio'],
20),

(cat_config, sub_perfil, 'Como adicionar um banner de capa na minha página?',
'Em "Configurações" > "Página Pública", clique em "Enviar banner" na seção de banner. Recomendamos imagem horizontal com pelo menos 1200x400px. O banner aparece na área de destaque da sua página pública, atrás da sua foto.',
ARRAY['banner','capa','imagem','fundo','hero','topo','foto'],
30),

(cat_config, sub_tema, 'Como escolher o tema visual da minha página?',
'Acesse "Configurações" > "Personalização" > "Template". Você verá 15 temas disponíveis divididos em categorias (Luxe, Bloom, Glow, Bold, Pure, Urban). Cada template tem uma paleta de cores e estilo diferente. Clique no tema desejado e salve — a mudança é imediata.',
ARRAY['tema','template','visual','cores','estilo','personalização','layout'],
10),

(cat_config, sub_tema, 'Posso personalizar as cores da minha página?',
'Sim! Além dos 15 templates prontos, você pode personalizar as cores dentro de cada tema. Acesse "Configurações" > "Personalização" e ajuste as cores de destaque. As cores se aplicam a botões, preços e destaques da sua página.',
ARRAY['cores','personalizar','tema','estilo','visual','botão','destaque'],
20),

(cat_config, sub_social, 'Como adicionar meu Instagram e WhatsApp na página?',
'Acesse "Perfil Profissional" e role até "Redes sociais". Adicione seu @usuario do Instagram e o número do WhatsApp com DDD. Esses links aparecem na sua página pública e permitem que clientes entrem em contato diretamente.',
ARRAY['instagram','whatsapp','redes sociais','link','adicionar','perfil'],
10),

-- ── 8. PÁGINA PÚBLICA ────────────────────────────────────────────────────────

(cat_pagina, NULL, 'Onde fico meu link público para compartilhar?',
'Seu link está em "Configurações" > "Página Pública" ou no topo do Dashboard. Ele tem o formato suaagenda.pro/agendar/seu-nome. Você pode copiar e compartilhar no WhatsApp, Instagram, cartão de visita ou qualquer canal que usar.',
ARRAY['link','compartilhar','url','endereço','página','público','copiar'],
10),

(cat_pagina, NULL, 'A página pública funciona bem no celular?',
'Sim! A página pública foi projetada mobile-first — ou seja, prioritariamente para celular. O layout se adapta perfeitamente a qualquer tamanho de tela. Seus clientes podem agendar facilmente pelo smartphone sem instalar nada.',
ARRAY['celular','mobile','responsivo','smartphone','funcionar','tela'],
20),

(cat_pagina, NULL, 'O cliente pode ver os preços dos serviços na página pública?',
'Você controla isso. Em "Configurações" > "Página Pública", há a opção "Exibir preços". Se ativada, os preços aparecem ao lado de cada serviço. Se preferir não mostrar (para negociar individualmente), basta desativar.',
ARRAY['preço','exibir','mostrar','ocultar','valor','serviço','página'],
30),

(cat_pagina, NULL, 'Como compartilhar meu link no Instagram?',
'Coloque seu link na bio do Instagram. Nas histórias, use o adesivo de link. No WhatsApp, envie direto para clientes ou adicione ao status. Você também pode criar um QR Code do link para colocar em cartões de visita ou na vitrine do salão.',
ARRAY['instagram','compartilhar','bio','link','qr code','divulgar','marketing'],
40),

(cat_pagina, NULL, 'Clientes podem deixar avaliações na minha página?',
'Sim! Após o atendimento, o sistema pode enviar automaticamente um link de avaliação por WhatsApp. O cliente dá uma nota (1 a 5 estrelas) e pode deixar um comentário. As avaliações aparecem na sua página pública.',
ARRAY['avaliação','estrelas','comentário','review','feedback','cliente','nota'],
50),

-- ── 9. DASHBOARD E RELATÓRIOS ────────────────────────────────────────────────

(cat_dashboard, NULL, 'Como ver o faturamento do mês?',
'No Dashboard, a seção "Faturamento" exibe o total de agendamentos confirmados no mês, o valor total gerado e a comparação com o mês anterior. Clique em "Ver detalhes" para ver o breakdown por serviço.',
ARRAY['faturamento','receita','dinheiro','mês','total','relatório','dashboard'],
10),

(cat_dashboard, NULL, 'Onde vejo quais serviços são mais agendados?',
'No Dashboard, na seção "Serviços mais populares", você vê o ranking dos serviços por quantidade de agendamentos. Isso ajuda a identificar o que tem mais saída e o que pode precisar de mais divulgação.',
ARRAY['serviço','popular','mais agendado','ranking','relatório','desempenho'],
20),

(cat_dashboard, NULL, 'Onde vejo as avaliações dos clientes?',
'Acesse "Avaliações" no menu lateral. Lá aparecem todas as notas e comentários deixados pelos clientes, com filtros por período e nota. A média geral também aparece na sua página pública.',
ARRAY['avaliações','notas','comentários','clientes','feedback','ver','estrelas'],
30),

(cat_dashboard, NULL, 'Como ver quais horários têm mais agendamentos?',
'No Dashboard, o gráfico de "Horários de pico" mostra os horários e dias da semana com maior demanda. Use esse dado para ajustar seus horários de funcionamento ou planejar promoções nos períodos mais fracos.',
ARRAY['horário','pico','demanda','análise','gráfico','semana','relatório'],
40),

-- ── 10. PROBLEMAS E SUPORTE ──────────────────────────────────────────────────

(cat_problemas, sub_tecnico, 'O cliente disse que não consegue agendar. O que fazer?',
'Verifique se: (1) o serviço desejado está ativo; (2) há horários disponíveis na data escolhida; (3) não há bloqueio ativo no período; (4) seu plano está ativo e dentro do período de teste. Se tudo estiver certo, peça ao cliente para tentar em outro navegador ou limpar o cache.',
ARRAY['não consegue','agendar','erro','cliente','problema','disponível','bloqueio'],
10),

(cat_problemas, sub_tecnico, 'Minha agenda está mostrando horários incorretos. O que fazer?',
'Verifique se o fuso horário do seu perfil está correto (deve ser "Brasília - GMT-3"). Acesse "Perfil Profissional" > "Fuso horário". Depois, confirme que os horários de funcionamento estão corretos em "Configurações" > "Horários".',
ARRAY['horário','incorreto','fuso','errado','agenda','problema','técnico'],
20),

(cat_problemas, sub_tecnico, 'Por que o QR Code PIX não aparece na página de agendamento?',
'Verifique se: (1) a chave PIX foi cadastrada em "Configurações" > "Pagamentos"; (2) a opção de sinal online está ativada; (3) o serviço tem preço definido maior que zero. Se o preço for zero, o sistema pula a etapa de pagamento automaticamente.',
ARRAY['pix','qr code','não aparece','pagamento','sinal','problema','erro'],
30),

(cat_problemas, sub_tecnico, 'As notificações de WhatsApp pararam de funcionar. O que fazer?',
'Isso geralmente acontece quando o WhatsApp desconecta. Acesse "Configurações" > "WhatsApp" e verifique se o status está "Conectado". Se estiver desconectado, escaneie o QR Code novamente com seu celular para reconectar.',
ARRAY['whatsapp','desconectado','parou','notificação','não envia','reconectar','qr code'],
40),

(cat_problemas, sub_tecnico, 'Como atualizar meu número de WhatsApp no sistema?',
'Acesse "Perfil Profissional" e atualize o campo "Telefone / WhatsApp". Insira o número com DDD (ex: 11 99999-9999). Esse número é usado para o botão de contato na sua página pública. O número de envio de mensagens automáticas é configurado separadamente em "Configurações" > "WhatsApp".',
ARRAY['whatsapp','número','telefone','atualizar','mudar','ddd','contato'],
50),

(cat_problemas, NULL, 'Como entrar em contato com o suporte do SuaAgenda.Pro?',
'Você pode falar com nosso suporte diretamente pelo WhatsApp. Acesse o menu "Mais" no app e clique em "Central de Suporte", ou envie mensagem para o número oficial do suporte que está no rodapé do site. Nossa equipe responde em horário comercial, de segunda a sábado.',
ARRAY['suporte','ajuda','contato','whatsapp','atendimento','problema','falar'],
60),

(cat_problemas, NULL, 'Meus dados estão seguros no SuaAgenda.Pro?',
'Sim. Todos os dados são armazenados com criptografia no Supabase (infraestrutura Postgres na AWS). O acesso é protegido por autenticação e RLS (Row Level Security) — cada profissional acessa apenas os próprios dados. Nunca vendemos dados de clientes.',
ARRAY['segurança','dados','privacidade','seguro','criptografia','LGPD'],
70);

END $$;

var kialiParser = require('Kiali Graph Parser')

// get recipients from incoming payload
var payload = JSON.parse(request.body);
trigger.recipients = payload.recipients
trigger.properties['All'] = kialiParser.getAll(['default', 'istio-system'], 10, 10)
trigger.properties['Service Relations'] = kialiParser.getServiceRelations('default', 'frontend')
trigger.properties['Service Details'] = JSON.stringify(kialiParser.getServiceDetails('default', 'currencyservice'))
trigger.properties['Html'] = kialiParser.getHtml(['istio-system', 'default'])
trigger.properties['Json'] = JSON.stringify(kialiParser.getJson('default'))
trigger.properties['Link'] = kialiParser.getLink();
form.post(trigger);
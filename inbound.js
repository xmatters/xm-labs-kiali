var kialiParser = require('Kiali Graph Parser')

// get recipients from incoming payload
var payload = JSON.parse(request.body);
trigger.recipients = payload.recipients
/*
 * get list of all services and relations
 * can take either a single namespace or a list of namespaces
 */
trigger.properties['default namespace - all'] = kialiParser.getAll('default', 1, 1)
trigger.properties['all namespaces - all'] = kialiParser.getAll(['default', 'istio-system'], 1, 1)
/*
 * get a single service's relations
 * can take either a single namespace or a list of namespaces
 */
trigger.properties['default namespace - frontend'] = kialiParser.getServiceRelations('default', 'frontend')
trigger.properties['all namespaces - frontend'] = kialiParser.getServiceRelations(['default', 'istio-system'], 'frontend')
/*
 * gets a single service's details
 * takes a single namespace
 */
trigger.properties['Service Details'] = JSON.stringify(kialiParser.getServiceDetails('default', 'currencyservice'))
/*
 * gets all services and relations as an html table (convenient to put in an email)
 * can take either a single namespace or a list of namespaces
 */
trigger.properties['default namespace - html'] = kialiParser.getHtml('default')
trigger.properties['all namespaces - html'] = kialiParser.getHtml(['istio-system', 'default'])
/*
 * gets the kiali graph in its json format
 * can take either a single namespace or a list of namespaces
 */
trigger.properties['default namespace - json'] = JSON.stringify(kialiParser.getJson('default'))
trigger.properties['all namespaces - json'] = JSON.stringify(kialiParser.getJson(['istio-system', 'default']))
/*
 * gets the link to the kiali graph
 */
trigger.properties['Link'] = kialiParser.getLink();


form.post(trigger);
#!/usr/bin/env python
import json
import redis
import optparse

parser = optparse.OptionParser()
parser.add_option('-f', '--file', dest='filename', default='twss.json',
                  help='File to read from or write to.')
parser.add_option('-H', '--host', dest='host', default='localhost',
                  help='Redis host.')
parser.add_option('-p', '--port', dest='port', default=6379,
                  help='Redis port.')
parser.add_option('-d', '--db', dest='db', default=0,
                  help='Redis DB.')

KEYS = ('brain_bayes_cats_scottbot', 'brain_bayes_words_scottbot')


def dump_data(filename, host, port, db):
    rc = redis.Redis(host=host, port=port, db=db)
    data = {}
    for k in KEYS:
        data[k] = rc.hgetall(k)
    with open(filename, 'w') as fp:
        json.dump(data, fp)


def load_data(filename, host, port, db):
    rc = redis.Redis(host=host, port=port, db=db)
    with open(filename) as fp:
        data = json.load(fp)
    for k in KEYS:
        rc.hmset(k, data[k])


if __name__ == '__main__':
    (opts, args) = parser.parse_args()
    filename, host, port, db = opts.filename, opts.host, opts.port, opts.db
    if args[0] == 'load':
        print 'Loading data from %s...' % filename
        load_data(filename, host, port, db)
    elif args[0] == 'dump':
        print 'Dumping data to %s...' % filename
        dump_data(filename, host, port, db)
    else:
        print 'Unknown command. Please say load or dump.'

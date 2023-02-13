reset
cat step0000* > collected-test.sql
remote-psql-runner.sh collected-test.sql
rm collected-test.sql

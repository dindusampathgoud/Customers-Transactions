import {
  Box,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Grid,
  IconButton,
  makeStyles,
  LinearProgress,
  Typography,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import React, { useState, useEffect } from "react";
import _ from "lodash";
import fetch from "./api/dataService";

const useStyles = makeStyles(() => ({
  expansionDetails: {
    marginTop: 9,
  },
  header: {
    margin: 5,
  },
}));

const calculateResults = (data) => {
  // Calculate points per transaction

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const pointsPerTransaction = data.map((transaction) => {
    let points = 0;
    let over100 = transaction.amt - 100;

    if (over100 > 0) {
      // A customer receives 2 points for every dollar spent over $100 in each transaction
      points = over100 * 2 + 50;
    }
    if (transaction.amt > 50 && transaction.amt < 100) {
      // plus 1 point for every dollar spent over $50 in each transaction
      points = transaction.amt - 50;
    }
    const month = new Date(transaction.transactionDt).getMonth();
    return { ...transaction, points, month };
  });

  let byCustomer = {};
  let totalPointsByCustomer = {};
  pointsPerTransaction.forEach((pointsPerTransaction) => {
    let { custid, name, month, points } = pointsPerTransaction;
    if (!byCustomer[custid]) {
      byCustomer[custid] = [];
    }
    if (byCustomer[custid][month]) {
      byCustomer[custid][month].points += points;
      byCustomer[custid][month].monthNumber = month;
      byCustomer[custid][month].numTransactions++;
    } else {
      byCustomer[custid][month] = {
        custid,
        name,
        monthNumber: month,
        month: months[month],
        numTransactions: 1,
        points,
      };
    }
  });

  let summaryByCustomer = [];
  for (var custKey in byCustomer) {
    byCustomer[custKey].forEach((cRow) => {
      summaryByCustomer.push(cRow);
    });
  }

  totalPointsByCustomer = summaryByCustomer.reduce(
    (results, current) => ({
      ...results,
      [current.custid]: {
        custid: current.custid,
        name: current.name,
        points:
          current.points +
          (results[current.custid] ? results[current.custid].points : 0),
      },
    }),
    {}
  );

  return {
    summaryByCustomer,
    pointsPerTransaction,
    totalPointsByCustomer: _.values(totalPointsByCustomer),
  };
};

const App = () => {
  const [transactionData, setTransactionData] = useState(null);
  const classes = useStyles();

  const getIndividualTransactions = (row) => {
    return transactionData.pointsPerTransaction.filter(
      (tRow) => row.custid === tRow.custid && row.monthNumber === tRow.month
    );
  };

  useEffect(() => {
    fetch().then((data) => {
      const results = calculateResults(data);
      setTransactionData(results);
    });
  }, []);

  if (transactionData == null) {
    return <LinearProgress />;
  }

  return (
    <>
      <Box m={3}>
        <Typography
          className={classes.header}
          variant="h5"
          component="h5"
          color="primary"
        >
          Customers Transactions
        </Typography>
        {transactionData.summaryByCustomer.map((t) => (
          <ExpansionPanel key={t.custid}>
            <ExpansionPanelSummary aria-label="Expand" id="expand">
              <IconButton style={{ marginBottom: 2 }}>
                <ExpandMoreIcon />
              </IconButton>
              <Grid
                container
                direction="row"
                className={classes.expansionDetails}
              >
                <Grid item sm={3} xs={12}>
                  <strong>Customer Name:</strong> {t.name}
                </Grid>
                <Grid item sm={3} xs={12}>
                  <strong>Month:</strong> {t.month}
                </Grid>
                <Grid item sm={3} xs={12}>
                  <strong>Trasactions:</strong> {t.numTransactions}
                </Grid>
                <Grid item sm={3} xs={12}>
                  <strong>Points:</strong> {t.points}
                </Grid>
              </Grid>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Transaction Date</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Transaction Amount</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Points</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getIndividualTransactions(t).map((tran) => (
                    <TableRow>
                      <TableCell>{tran.transactionDt}</TableCell>
                      <TableCell>{tran.amt}</TableCell>
                      <TableCell>{tran.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        ))}
      </Box>
      <Box m={3}>
        <Typography
          className={classes.header}
          variant="h5"
          component="h5"
          color="primary"
        >
          Total Reward Points
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Customer Name</strong>
              </TableCell>
              <TableCell>
                <strong>Total Points</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactionData.totalPointsByCustomer.map(({ name, points }) => (
              <TableRow>
                <TableCell>{name}</TableCell>
                <TableCell>{points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
  );
};

export default App;
